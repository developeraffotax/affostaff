import { LoginResult, User } from "./types";

export {};

declare global {
  interface Window {
    agent: {
      getConfig: () => Promise<any>;
      login: (email: string, password: string) => Promise<LoginResult>;
      logout: () => Promise<any>;
      getState: () => Promise<any>;
      openAtLogin: (enabled: boolean) => Promise<any>;
    };
  }
}