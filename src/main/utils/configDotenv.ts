import path from "path";
import dotenv from "dotenv";
import { app } from "electron";
import { isDev } from "./isDev";

export const configDotenv = () => {
  // await app.whenReady();

  // ✅ Determine correct .env path depending on environment
   
  const envPath = isDev()
    ? path.join(process.cwd(), ".env") // dev mode: project root
    : path.join(process.resourcesPath, ".env"); // production build
  dotenv.config({ path: envPath });
};
