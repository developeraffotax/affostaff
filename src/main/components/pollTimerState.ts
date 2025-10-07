import axios from "axios";
import { machineIdSync } from "node-machine-id";
import { User } from "../..//types";

const DEVICE_ID = machineIdSync(true);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
const STATUS_POLL_MS = parseInt(process.env.STATUS_POLL_MS || "10000", 10);

export async function pollTimerState(
  {jwt}: User,
  onTimerUpdate: (running: boolean) => void
) {

  console.log("jwt in polltimerstate", jwt)

  if (!jwt) return;
  try {
    const { data } = await axios.get(
      `${BACKEND_BASE_URL}/api/agent/timer-status`,
      {
        headers: { Authorization: `Bearer ${jwt}` },
        params: { deviceId: DEVICE_ID },
        timeout: 10000,
      }
    );

    const running = !!data?.running;
    onTimerUpdate(running); // 🔥 call back to update your main state
  } catch (e) {
    console.log("Error in pollTimerState", e)
  } finally {
    setTimeout(pollTimerState, STATUS_POLL_MS);
  }
}
