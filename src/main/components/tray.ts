import path from "path";
import fs from "fs";
import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";
import { createWindow } from "../window";
import { Timer } from "../../types";

export function createTray(mainWin: BrowserWindow, timer: Timer) {
  const isDev = !app.isPackaged;

  const iconPath = isDev
    ? path.join(app.getAppPath(), "assets", "icon.png")
    : path.join(process.resourcesPath, "assets", "icon.png");

  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : undefined;

  const tray = new Tray(icon);
  tray.setToolTip("Affotax Monitor Agent");

  // ✅ helper function to rebuild the tray menu dynamically
  const updateTrayMenu = () => {
    const menu = Menu.buildFromTemplate([
      {
        label: "Open",
        click: () => (mainWin ? mainWin.show() : createWindow()),
      },
      {
        label: `Timer: ${timer.isRunning ? "Running" : "Idle"}`,
        enabled: false,
      },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ]);

    tray.setContextMenu(menu);
  };

  // initialize once
  updateTrayMenu();

  // open main window when clicking the tray icon
  tray.on("click", () => (mainWin ? mainWin.show() : createWindow()));

  // ✅ return both tray and updater so main process can call it
  return { tray, updateTrayMenu };
}
