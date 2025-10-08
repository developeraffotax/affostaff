import { app, BrowserWindow, ipcMain, Tray } from "electron";
import { createWindow } from "./window";
import { createTray } from "./components/tray";
import { agentLogin, loadUser } from "./components/auth";
import { pollTimerState } from "./components/pollTimerState";
import { Timer, User } from "../types";
import { configDotenv } from "./utils/configDotenv";
import { connectSocket } from "./components/socket";
import { takeAndUploadScreenshot } from "./components/screenshot";

// --------------------
//  Initialization
// --------------------
configDotenv();

if (require("electron-squirrel-startup")) app.quit();

// --------------------
//  Globals
// --------------------
let mainWin: BrowserWindow | null = null;
let trayData: { tray: Tray; updateTrayMenu: () => void } | null = null;

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
  trayData?.updateTrayMenu();
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
setInterval(() => {
  if (timer.isRunning && user.jwt) {
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
