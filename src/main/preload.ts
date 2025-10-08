// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

 


import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("agent", {
  // -------------------------------
  // 🔹 INVOKE HANDLERS (promises)
  // -------------------------------
  getConfig: () => ipcRenderer.invoke("agent:getConfig"),

  login: (email: string, password: string) =>
    ipcRenderer.invoke("agent:login", { email, password }),

  logout: () => ipcRenderer.invoke("agent:logout"),

  getState: () => ipcRenderer.invoke("agent:getState"),

  openAtLogin: (enabled: boolean) =>
    ipcRenderer.invoke("agent:autoLaunch", enabled),





  // -------------------------------
  // 🔹 EVENT SUBSCRIPTIONS
  // -------------------------------
  onTimerUpdate: (callback: (data: any) => void) => {
    const listener = (_event: IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on("timer:update", listener);

    // Return cleanup function
    return () => ipcRenderer.removeListener("timer:update", listener);
  },

  onUserUpdate: (callback: (user: any) => void) => {
    const listener = (_event: IpcRendererEvent, user: any) => callback(user);
    ipcRenderer.on("user:update", listener);
    return () => ipcRenderer.removeListener("user:update", listener);
  },
 
});