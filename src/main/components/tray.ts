 
import path from "path";
import fs from "fs";
import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";
import { createWindow } from "../window";
import { Timer } from "../../types";




export function createTray(mainWin: BrowserWindow, { isRunning }: Timer) {
  // const iconPath = path.join(__dirname, '..', 'renderer', 'assets', 'icon.png');
  const iconPath = path.join(app.getAppPath(), "assets", "icon.png");
  console.log("The icons path is", iconPath);
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : null;
  const tray = new Tray(icon?.isEmpty() ? undefined : icon);
  const menu = Menu.buildFromTemplate([
    { label: "Open", click: () => (mainWin ? mainWin.show() : createWindow()) },
    { label: `Timer: ${isRunning ? "Running" : "Idle"}`, enabled: false },
    { label: "Quit", click: () => app.quit() },
  ]);
  tray.setToolTip("Affotax Monitor Agent");
  tray.setContextMenu(menu);
  tray.on("click", () => (mainWin ? mainWin.show() : createWindow()));

  return tray;
}
