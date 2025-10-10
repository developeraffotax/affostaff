import path from "path";
import fs from "fs";
import { app, BrowserWindow, Menu, nativeImage, Tray } from "electron";
import { createWindow } from "../window";
import { Timer } from "../../types";

export function createTray(mainWin: BrowserWindow, timer: Timer) {
  const isDev = !app.isPackaged;

  const iconPathForIdle = isDev
    ? path.join(app.getAppPath(), "assets", "idleTray.png")
    : path.join(process.resourcesPath, "assets", "idleTray.png");

  const iconPathForActive = isDev
    ? path.join(app.getAppPath(), "assets", "activeTray.png")
    : path.join(process.resourcesPath, "assets", "activeTray.png");

  const tray = new Tray(
    nativeImage.createFromPath(
      timer.isRunning ? iconPathForActive : iconPathForIdle
    )
  );

  tray.setToolTip("Affotax Monitor Agent");

  // ✅ Single function that updates everything (icon + tooltip + menu)
  const updateTray = (isRunning: boolean) => {
    timer.isRunning = isRunning;

    const iconPath = isRunning ? iconPathForActive : iconPathForIdle;
    if (fs.existsSync(iconPath)) {
      tray.setImage(nativeImage.createFromPath(iconPath));
    }

    tray.setToolTip(`Affotax Monitor Agent (${isRunning ? "Running" : "Idle"})`);

    const menu = Menu.buildFromTemplate([
      {
        label: "Open",
        click: () => (mainWin ? mainWin.show() : createWindow()),
      },
      {
        label: `Timer: ${isRunning ? "Running" : "Idle"}`,
        enabled: false,
      },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ]);
    tray.setContextMenu(menu);
  };

  // initialize
  updateTray(timer.isRunning);

  // open window when clicking tray
  tray.on("click", () => (mainWin ? mainWin.show() : createWindow()));

  // return both the tray and the unified updater
  return { tray, updateTray };
}
