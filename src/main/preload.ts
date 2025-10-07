// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";




contextBridge.exposeInMainWorld("agent", {
  getConfig: () => ipcRenderer.invoke("agent:getConfig"),
  login: (email: string, password: string, ) =>
    ipcRenderer.invoke("agent:login", { email, password }),
  logout: () => ipcRenderer.invoke("agent:logout"),
  getState: () => ipcRenderer.invoke("agent:getState"),
  openAtLogin: (enabled: boolean) =>
    ipcRenderer.invoke("agent:autoLaunch", enabled),
});
