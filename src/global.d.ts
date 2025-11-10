 
import { LoginResult, Timer, User } from "./types";

export {};

declare global {
  interface Window {
    agent: {
      getConfig: () => Promise<any>;
      login: (email: string, password: string) => Promise<LoginResult>;
      logout: () => Promise<any>;
      getState: () => Promise<any>;
      openAtLogin: (enabled: boolean) => Promise<any>;

      onTimerUpdate: (callback: (timer: Timer) => void) => () => void;
      onLogout: (callback: () => void) => () => void;
      onUserUpdate: (callback: (user: User) => void) => () => void;
      onKeyStroke: (callback: (data: any) => void) => () => void;
      onTimeLeftToClose: (callback: (data: {active: boolean, secondsLeft: number}) => void) => () => void;

    };
  }
}