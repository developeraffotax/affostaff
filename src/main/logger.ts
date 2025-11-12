// src/main/logger.ts
import fs from "fs";
import path from "path";
import { app } from "electron";

const logFile = path.join(app.getPath("userData"), "app.log");

// Make sure logs directory exists
fs.mkdirSync(path.dirname(logFile), { recursive: true });

export function log(...args: any[]) {
  const message = args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  process.stdout.write(`[${timestamp}] ${message}\n`);
}

// Catch uncaught errors
process.on("uncaughtException", (err) => log("Uncaught Exception:", err.stack));
process.on("unhandledRejection", (reason) => log("Unhandled Rejection:", reason));
