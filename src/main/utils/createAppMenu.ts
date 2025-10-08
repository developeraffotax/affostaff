import { Menu, app, BrowserWindow, MenuItemConstructorOptions } from "electron";
import { clearUser } from "../components/auth";

export function createAppMenu(win?: BrowserWindow) {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "Menu",
      submenu: [
        {
          label: "Reload",
          accelerator: "Ctrl+R",
          click: () => win?.reload(),
        },
         
        { role: "minimize" },
        { type: "separator" },
        {
          label: "Logout",
          accelerator: "Ctrl+L",
          click: async () => {
            await clearUser();
            win?.webContents.send("agent:logout");
          },
        },
         
        {
          label: "Quit",
          accelerator: "Ctrl+Q",
          click: () => app.quit(),
        },
      ],
    },
     
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
