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

export type LoginResult = { success: true; user: User, message?: string } | { success: false; message: string };

export interface Timer {
  _id: string;
  isRunning: boolean;
  startTime: string;
  endTime?: string;

  department?: string;
  clientName?: string;
  task?: string;
}
