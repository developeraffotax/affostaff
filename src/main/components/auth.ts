 
import { app } from "electron";
import axios from "axios";
import { machineIdSync } from "node-machine-id";
import { LoginCredentials, LoginResult, User } from "../../types";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { configDotenv } from "../utils/configDotenv";

configDotenv();

// CONSTANTS
const DEVICE_ID = machineIdSync(true);

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
const SECRET_KEY = process.env.SECRET_KEY;


const ENCRYPTION_KEY = crypto.createHash("sha256").update(SECRET_KEY).digest();
const IV = Buffer.alloc(16, 0); 

// PATHS
const userDataPath = app.getPath("userData");
const tokenFilePath = path.join(userDataPath, "auth.enc");






export async function saveUser(user: User) {
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(JSON.stringify(user), "utf8", "base64");
  encrypted += cipher.final("base64");
  fs.writeFileSync(tokenFilePath, encrypted);
}



export async function loadUser() {
  if (!fs.existsSync(tokenFilePath)) return null;
  const encrypted = fs.readFileSync(tokenFilePath, "utf8");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");
 
  return JSON.parse(decrypted);
}



export async function clearUser() {
  if (fs.existsSync(tokenFilePath)) fs.unlinkSync(tokenFilePath);
}







export async function agentLogin(
  payload: LoginCredentials
): Promise<LoginResult> {
  try {
    console.log("payload is", payload);

    if (!payload.email || !payload.password) {
      throw new Error("Email & Password required");
    }

    const { data } = await axios.post(
      `${BACKEND_BASE_URL}/api/v1/user/login/user`,
      {
        email: payload.email,
        password: payload.password,
      },
      { timeout: 15000 }
    );

    if (!data || !data.token) {
      return {
        success: false,
        message: "Invalid response from server: Missing token",
      };
    }

    const user: User = {
      jwt: data.token,
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
    };
    

    await saveUser(user);

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      message:
        error?.response?.data?.message || error.message || "Login failed",
    };
  }
}
