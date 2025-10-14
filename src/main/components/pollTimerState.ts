import axios from "axios";
import { machineIdSync } from "node-machine-id";
import { Timer, User } from "../../types";
import { configDotenv } from "../utils/configDotenv";
 

configDotenv();

const DEVICE_ID = machineIdSync(true);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
const STATUS_POLL_MS = parseInt(process.env.STATUS_POLL_SECONDS || "30", 10) * 1000;

export async function pollTimerState(
  user: User,
  onTimerUpdate: (running: Timer) => void
) {
  if (!user.jwt) return;

  try {
    const { data } = await axios.get(
      `${BACKEND_BASE_URL}/api/v1/timer/agent/timer-status`,
      {
        headers: { Authorization: `${user.jwt}` },
        timeout: 10000,
      }
    );

    console.log("POLL TIMER DATA", data);

    if (data?.timer) {
      // Timer is running — update normally
      onTimerUpdate(data.timer);
    } else {
      // No timer running — send a default empty timer
      onTimerUpdate({
        _id: "",
        isRunning: false,
        startTime: "",
        task: "",
        department: "",
        clientName: "",
      });
    }
  } catch (e) {
    console.log("Error in pollTimerState", e);
  } finally {
    setTimeout(() => pollTimerState(user, onTimerUpdate), STATUS_POLL_MS);
  }
}
