import { app, BrowserWindow, ipcMain, Tray } from "electron";
import { createWindow } from "./window";
import { createTray } from "./components/tray";
import { agentLogin, loadUser } from "./components/auth";
import { pollTimerState } from "./components/pollTimerState";
import { Timer, User } from "../types";
import { configDotenv } from "./utils/configDotenv";
import { connectSocket } from "./components/socket";
import { takeAndUploadScreenshot } from "./components/screenshot";

import { getActivity } from "./components/activityTracker";
import {
  flushActivity,
  startPythonServer,
  stopPythonServer,
} from "./utils/pythonServer";
import { updateElectronApp } from "update-electron-app";
import path from "path";

// --------------------
//  Initialization
// --------------------
configDotenv();

if (require("electron-squirrel-startup")) app.quit();

const SCREENSHOT_INTERVAL_SECONDS =
  parseInt(process.env.SCREENSHOT_INTERVAL_SECONDS) || 300;

// --------------------
//  Globals
// --------------------
let mainWin: BrowserWindow | null = null;
let trayData: { tray: Tray; updateTray: (isRunning: boolean) => void } | null =
  null;

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

export const updateTimer = (updatedTimer: Timer) => {
  Object.assign(timer, updatedTimer);
  sendToRenderer("timer:update", timer);
};

export const updateUser = (updateUser: User) => {
  Object.assign(user, updateUser);
};

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}














// --------------------
//  App Ready Event
// --------------------
app.on("ready", async () => {
  // Absolute path to your packaged .exe (used by Windows Task Scheduler)
  // const exePath = process.execPath;

  // Enable app auto-launch on Windows startup
  app.setLoginItemSettings({
    openAtLogin: true,
    // path: exePath,
    // args: [
    //   '--process-start-args', `"--hidden"`
    // ],
    
  });

   

  console.log("🚀 Auto-launch enabled at startup:", exePath);




  updateElectronApp({
    updateInterval: "1 hour", // optional, defaults to every launch
    notifyUser: true, // show notification if an update is available
  });

  mainWin = createWindow();
  trayData = createTray(mainWin, timer);

  // Start the Python server
  startPythonServer(mainWin);

  mainWin.webContents.once("did-finish-load", async () => {
    console.log("App ready - checking for saved user..., did-finish-load");
    const savedUser = await loadUser();
    if (!savedUser?.jwt) return;
    console.log("App ready - checking for saved user..., did-finish-load if (!savedUser?.jwt) return;");
    Object.assign(user, savedUser);

    // User exists — start background sync
    connectSocket(user, updateTimer);
    pollTimerState(user, updateTimer);

    // ✅ Start flushing queued screenshots
    import("./components/screenshot").then(({ flushQueue }) =>
      flushQueue(user)
    );
  });
});










// Run screenshot loop every 5 minutes
setInterval(async () => {
  if (timer.isRunning && user.jwt) {
    const { keyboardActivity, mouseActivity } = flushActivity();
    const activity = getActivity(keyboardActivity, mouseActivity);
    console.log("Collected activity:", activity);

    takeAndUploadScreenshot(user, activity);
  }
}, SCREENSHOT_INTERVAL_SECONDS * 1000);












// --------------------
//  IPC Handlers
// --------------------
ipcMain.handle("agent:getState", () => ({ user, timer }));

ipcMain.handle("agent:login", async (_evt, payload) => {
  const res = await agentLogin(payload);

  if (res.success) {
    Object.assign(user, res.user);

    connectSocket(user, updateTimer);
    pollTimerState(user, updateTimer);
  }

  return res;
});














// --------------------
//  App Lifecycle
// --------------------

app.on("before-quit", () => {
  console.log("🧹 Cleaning up Python process...");
  stopPythonServer();
});

app.on("will-quit", () => {
  stopPythonServer();
});

app.on("window-all-closed", () => {
  stopPythonServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWin = createWindow();
  }
});
