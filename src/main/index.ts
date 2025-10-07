import { app, BrowserWindow, ipcMain, Tray } from "electron";

import dotenv from "dotenv";
import { createWindow } from "./window";
import { createTray } from "./components/tray";
import {   agentLogin, clearUser, loadUser } from "./components/auth";
import { connectSocket } from "./components/socket";
import { pollTimerState } from "./components/pollTimerState";
import { Timer, User } from "../types";
dotenv.config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

// let BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:5000";
let mainWin: BrowserWindow | null = null;
let tray: Tray | null = null;
// let autoLaunchEnabled = false;


// let timerRunning = false;

const timer: Timer = {
  id: '',
  isRunning: false,
  startTime: '',

}

 


const  user : User = {
  id: '',
  jwt: '',

  name: '',
  email: ''


}
















// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  mainWin = createWindow();

  tray = createTray(mainWin, timer);

  const savedUser = await loadUser();

  
  if (savedUser?.jwt && savedUser?.email) {
    
    user.id = savedUser.id;
    user.email = savedUser.email;
    user.jwt = savedUser.jwt;
    user.name = savedUser.name;

    // connectSocket(
    //   {
    //     jwt,
    //     email,

    //   },
    //   (running) => {
    //     timerRunning = running;
    //     console.log("Timer updated in sokcet:", running);
    //   }
    // );


    // pollTimerState(user, (running) => {
    //   timer.isRunning = running;
    //   console.log("Timer updated in poll timer state:", running);
    // })



    
  }








});



// app.whenReady().then(async () => {
//  createWindow();
//  createTray();

//  connectSocket(); }
//  pollTimerState();
//  takeAndUploadScreenshot();
//  flushQueue();
//  });







//  ipcMain.handle('agent:getConfig', () => ({ BACKEND_BASE_URL,
//  SCREENSHOT_INTERVAL_MS }));


 ipcMain.handle('agent:getState', () => ({ user, timer }));


 ipcMain.handle('agent:login', async (_evt, payload) => agentLogin(payload));


 ipcMain.handle('agent:logout', async () => { 
  await clearUser(); 
//   jwt = null;
//  email = null;
//   timerRunning = false;
//    return true;

  user.email = '';
  user.id = '';
  user.jwt = '';
  user.name = '';
 
  
  });


//  ipcMain.handle('agent:autoLaunch', (_evt, enabled) => { setAutoLaunch(enabled);
//  return true; })




































// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
