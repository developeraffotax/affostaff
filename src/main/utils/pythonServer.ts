import net from "net";
import path from "path";
import { spawn, ChildProcessWithoutNullStreams, exec } from "child_process";
import type { BrowserWindow } from "electron";
import type { ActivityEvent, KeyboardActivity, MouseActivity } from "../../types";

let pyProc: ChildProcessWithoutNullStreams | null = null;
let server: net.Server | null = null;

let keyboardActivity: KeyboardActivity[] = [];
let mouseActivity: MouseActivity[] = [];

/**
 * Starts the Python background listener and TCP server.
 */
export function startPythonServer(mainWin: BrowserWindow) {
  // Determine .exe path
  const exePath =
    process.env.NODE_ENV === "production"
      ? path.join(process.resourcesPath, "keyboard_listener.exe")
      : path.join(process.cwd(), "resources", "keyboard_listener.exe");

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
    server.close(() => console.log("🐍 TCP server closed"));
  }

  if (pyProc) {
    try {
      // Try normal kill first
      pyProc.kill();

      // Extra safety for Windows: force kill by name
      if (process.platform === "win32") {
        exec('taskkill /IM keyboard_listener.exe /F', (err) => {
          if (!err) console.log("🐍 Python process forcibly killed");
        });
      }
    } catch (err) {
      console.error("Failed to stop Python process:", err);
    }
  }
}
