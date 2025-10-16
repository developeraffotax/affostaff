import net from "net";
import path from "path";
import { spawn, ChildProcessWithoutNullStreams, exec } from "child_process";
import { app, type BrowserWindow } from "electron";
import type { ActivityEvent, KeyboardActivity, MouseActivity } from "../../types";

let pyProc: ChildProcessWithoutNullStreams | null = null;
let server: net.Server | null = null;

let keyboardActivity: KeyboardActivity[] = [];
let mouseActivity: MouseActivity[] = [];

/**
 * Starts the Python background listener and TCP server.
 */
export function startPythonServer(mainWin: BrowserWindow) {
  if (pyProc && !pyProc.killed) {
    console.log("🐍 Python process already active, skipping start.");
    return;
  }
  if (server && server.listening) {
    console.log("🐍 TCP server already active, skipping start.");
    return;
  }

  const isDev = !app.isPackaged;

  // Determine .exe path
  const exePath = isDev
    ? path.join(process.cwd(), "resources", "keyboard_listener", "keyboard_listener.exe")
    : path.join(process.resourcesPath, "keyboard_listener", "keyboard_listener.exe");

  // Spawn the Python executable
  pyProc = spawn(exePath);

  pyProc.stdout.on("data", (data) => console.log("🐍 Python:", data.toString()));
  pyProc.stderr.on("data", (data) => console.error("🐍 Python error:", data.toString()));
  pyProc.on("close", () => console.log("🐍 Python process closed."));

  // Create a TCP server to receive events
  server = net.createServer((socket) => {
    console.log("🐍 Python connected to TCP server");

    socket.on("data", (data) => {
      const messages = data.toString().split("\n").filter(Boolean);
      messages.forEach((msg) => {
        try {
          const event: ActivityEvent = JSON.parse(msg);

          // 🧩 Handle shutdown message from Python
          if (event.type === "shutdown") {
            console.log("🐍 Received shutdown from Python, closing socket gracefully.");
            socket.end(); // Graceful close
            return;
          }

          // Handle keyboard/mouse events
          if (event.type === "keyboard") {
            keyboardActivity.push({
              type: event.type,
              key: event.key,
              pressed: event.pressed,
              timestamp: event.timestamp,
            });
          } else {
            mouseActivity.push({
              type: event.type,
              subType: event.subType,
              position: event.position,
              button: event.button || null,
              pressed: event.pressed ?? null,
              delta: event.delta || null,
              timestamp: event.timestamp,
            });
          }

          mainWin.webContents.send("key-event", event);
        } catch (err) {
          console.error("🐍 Parse error:", err);
        }
      });
    });

    socket.on("close", () => {
      console.log("🐍 Python socket closed");
    });

    socket.on("error", (err: NodeJS.ErrnoException) => {
      // ECONNRESET should not happen with graceful shutdown, but just in case
      if (err.code === "ECONNRESET") {
        console.warn("🐍 Python connection reset (ignored)");
      } else {
        console.error("🐍 Socket error:", err);
      }
    });
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "ECONNRESET") {
      console.warn("🐍 Server connection reset (ignored)");
    } else {
      console.error("🐍 Server error:", err);
    }
  });

  server.listen(7070, "127.0.0.1", () => {
    console.log("🐍 Listening on port 7070 for Python events");
  });
}

/**
 * Returns and resets the collected activity since last call.
 */
export function flushActivity() {
  const current = { keyboardActivity, mouseActivity };
  keyboardActivity = [];
  mouseActivity = [];
  return current;
}

/**
 * Cleanly stops the Python process and server.
 */
export function stopPythonServer() {
  if (server) {
    try {
      server.close(() => console.log("🐍 TCP server closed"));
      server = null;
    } catch (err) {
      console.error("🐍 Error closing server:", err);
    }
  }

  if (pyProc) {
    try {
      // Send shutdown message first (graceful)
      // No need if Python already sent shutdown
      pyProc.kill("SIGTERM");

      // Extra safety for Windows: force kill by name
      if (process.platform === "win32") {
        exec("taskkill /IM keyboard_listener.exe /F", (err) => {
          if (!err) console.log("🐍 Python process forcibly killed");
        });
      }
      pyProc = null;
    } catch (err) {
      console.error("🐍 Failed to stop Python process:", err);
    }
  }
}
