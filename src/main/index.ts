import { app, BrowserWindow, ipcMain, Tray } from "electron";
import { createWindow } from "./window";
import { createTray } from "./components/tray";
import { agentLogin, loadUser } from "./components/auth";
import { pollTimerState } from "./components/pollTimerState";
import { Timer, User } from "../types";
import { configDotenv } from "./utils/configDotenv";
import { connectSocket } from "./components/socket";
import { takeAndUploadScreenshot } from "./components/screenshot";
import { getActiveWindowActivity } from "./components/userActivity";
import net from "net";
import path from "path";
import { spawn } from "child_process";
 

// --------------------
//  Initialization
// --------------------
configDotenv();

if (require("electron-squirrel-startup")) app.quit();

// --------------------
//  Globals
// --------------------
let mainWin: BrowserWindow | null = null;
let trayData: { tray: Tray; updateTray: (isRunning: boolean) => void } | null = null;

let pyProc = null;


const timer: Timer = {
  _id: "",
  isRunning: false,
  startTime: "",
  department: "",
  clientName: "",
  task: "",
};

const user: User = {
  id: "",
  jwt: "",
  name: "",
  email: "",
};

// --------------------
//  Utility: Safe Renderer Messaging
// --------------------
function sendToRenderer(channel: string, payload: any) {
  trayData?.updateTray(timer.isRunning);
  if (mainWin && !mainWin.isDestroyed()) {
    mainWin.webContents.send(channel, payload);
  }
}







// --------------------
//  App Ready Event
// --------------------
app.on("ready", async () => {
  mainWin = createWindow();
  trayData = createTray(mainWin, timer);

   










 // Run the Python .exe (handle production paths)
  const exePath = app.isPackaged
    ? path.join(process.resourcesPath, "keyboard-listener.exe")
    : path.join(process.cwd(), "resources", "keyboard-listener.exe");

  pyProc = spawn(exePath);

  pyProc.stdout.on("data", (data) => console.log("Python:", data.toString()));
  pyProc.stderr.on("data", (data) => console.error("Python error:", data.toString()));
  pyProc.on("close", () => console.log("Python process closed."));

  // Start TCP server to receive keyboard events
  const server = net.createServer((socket) => {
    console.log("Python connected");
    socket.on("data", (data) => {
      const messages = data.toString().split("\n").filter(Boolean);
      messages.forEach((msg) => {
        try {
          const event = JSON.parse(msg);
          console.log("Key Event:", event);
           mainWin.webContents.send("key-event", event);
        } catch (err) {
          console.error("Parse error:", err);
        }
      });
    });
  });

  server.listen(7070, "127.0.0.1", () => {
    console.log("Listening on port 7070");
  });





















  mainWin.webContents.once("did-finish-load", async () => {
    const savedUser = await loadUser();

    if (savedUser?.jwt && savedUser?.email) {
      Object.assign(user, savedUser);


      connectSocket(user, (updatedTimer) => {
       Object.assign(timer, updatedTimer);
       sendToRenderer("timer:update", timer);
      //  console.log("Received timer update via socket:", updatedTimer);
      });

      // Start polling timer immediately after loading user
      pollTimerState(user, (fetchedTimer) => {
        Object.assign(timer, fetchedTimer);
        sendToRenderer("timer:update", timer);
      });
    }
  });


   //takeAndUploadScreenshot(user, timer.isRunning);
   //flushQueue()
});




// Run screenshot loop every 5 minutes
setInterval(async() => {
  if (timer.isRunning && user.jwt) {

 
    
    const activeWindow = getActiveWindowActivity();

    console.log("Active Window:", activeWindow);

    takeAndUploadScreenshot(user, true);
  }
},   10 * 1000);


// --------------------
//  IPC Handlers
// --------------------
ipcMain.handle("agent:getState", () => ({ user, timer }));

ipcMain.handle("agent:login", async (_evt, payload) => {
  const res = await agentLogin(payload);

  if (res.success) {
    Object.assign(user, res.user);


    connectSocket(user, (updatedTimer) => {
       Object.assign(timer, updatedTimer);
       sendToRenderer("timer:update", timer);
      //  console.log("Received timer update via socket:", updatedTimer);
      });

      
    // Start polling timer after successful login
    pollTimerState(user, (fetchedTimer) => {
      Object.assign(timer, fetchedTimer);
      sendToRenderer("timer:update", timer);
    });
  }

  return res;
});






// --------------------
//  App Lifecycle
// --------------------
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWin = createWindow();
  }
});
