import path from "path";
import fs from "fs";
import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";
import { createWindow } from "../window";
import { Timer } from "../../types";

export function createTray(mainWin: BrowserWindow, { isRunning }: Timer) {
  // Determine correct path depending on environment
  const isDev = !app.isPackaged;

  const iconPath = isDev
    ? path.join(app.getAppPath(), "assets", "icon.png") // during dev
    : path.join(process.resourcesPath, "assets", "icon.png"); // after build

  console.log("Tray icon path:", iconPath);

  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : undefined;

  const tray = new Tray(icon);
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
