// User information stored in DB or returned by API
export interface User {
  id: string;
  name?: string;
  email: string;
  jwt: string; //auth token

  role?: "admin" | "user" | "manager"; // optional roles
}

// Login credentials (for login request)
export interface LoginCredentials {
  email: string;
  password: string;
}

export type LoginResult = { success: true; user: User; message?: string } | { success: false;  message: string };

export interface Timer {
  _id: string;
  isRunning: boolean;
  startTime: string;
  endTime?: string;

  department?: string;
  clientName?: string;
  task?: string;
}


export interface ActivityBase {
  type: "keyboard" | "mouse";
  timestamp: number; // epoch time in milliseconds
}

export interface KeyboardActivity extends ActivityBase {
  type: "keyboard";
  key: string;
  pressed?: boolean | null;
}

export interface MouseActivity extends ActivityBase {
  type: "mouse";
  subType: "click" | "move" | "scroll";
  button?: "left" | "right" | "middle" | null;
  position: { x: number; y: number };
  pressed?: boolean | null;
  delta?: { x: number; y: number } | null;
}

// Union of all possible events
export type ActivityEvent = KeyboardActivity | MouseActivity;







export interface ActiveWindow {
  title: string;
  application: string;
}

export interface ActivitySummary {
  keyboardCount: number;
  mouseCount: number;
  overallActivityPercent: number; // 0-100%
  keyboardActivityPercent: number; // 0-100%
  mouseActivityPercent: number; // 0-100%
  period: string; // fixed period for now
  startedAt: string; // ISO timestamp
  endedAt: string; // ISO timestamp
}
 

 export interface ScreenshotMeta {
   userId: string;
   timestamp: string; // ISO timestamp
   deviceId: string; // unique device identifier
 }  