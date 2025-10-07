import keytar from "keytar";
import axios, { AxiosError, isAxiosError } from "axios";
import { machineIdSync } from "node-machine-id";
import os from "os";
import { LoginCredentials, LoginResult, User } from "../../types";

const SERVICE_NAME = "AffotaxMonitor";
const ACCOUNT_NAME = "crm-agent";
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;


const DEVICE_ID = machineIdSync(true);

export async function loadUser(): Promise<User> {
  const blob = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  if (!blob) return null;
  try {
    return JSON.parse(blob);
  } catch {
    return null;
  }
}

export async function saveUser(user: User) {
  await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, JSON.stringify(user));
}

export async function clearUser() {
  await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
}

export async function agentLogin(payload: LoginCredentials): Promise<LoginResult> {
  try {
    console.log("payload is", payload);


     if (!payload.email || !payload.password) {
      throw new Error("Email & Password required");
    }

const { data } = await axios.post("http://localhost:8080/api/v1/user/login/user", {
      email: payload.email,
      password: payload.password,
    }, { timeout: 15000 });

    if (!data || !data.token) {
      return { success: false, message: "Invalid response from server: Missing token" };
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
    return { success: false, message: error?.response?.data?.message || error.message || "Login failed" };
  }
}
