
// components/pollTimerState.ts
import axios from "axios";
import { machineIdSync } from "node-machine-id";
import { Timer, User } from "../../types";
import { configDotenv } from "../utils/configDotenv";

configDotenv();

const DEVICE_ID = machineIdSync(true);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
const STATUS_POLL_MS = parseInt(process.env.STATUS_POLL_SECONDS || "30", 10) * 1000;

// Keep track of timeout globally
let pollTimeout: NodeJS.Timeout | null = null;
let isPollingActive = false;

/**
 * Starts polling timer state at fixed intervals.
 * Returns a stop function to cancel further polling.
 */
export function pollTimerState(user: User, onTimerUpdate: (running: Timer) => void) {
    if (isPollingActive) {
    console.log("⚠️ Polling already active — skipping start");
    return;
  }

  // Stop any existing poll before starting a new one
  stopPolling();

  if (!user?.jwt) return;

  isPollingActive = true;

  const doPoll = async () => {
    if (!isPollingActive || !user?.jwt) return;

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
        onTimerUpdate(data.timer);
      } else {
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
      console.log("Error in pollTimerState", e.message);
    } finally {
      // Schedule next poll only if still active
      if (isPollingActive) {
        pollTimeout = setTimeout(doPoll, STATUS_POLL_MS);
      }
    }
  };

  // Start first poll immediately
  doPoll();

  // Return a cleanup function
  return stopPolling;
}

/**
 * Stops polling loop safely.
 */
export function stopPolling() {
  if (pollTimeout) {
    clearTimeout(pollTimeout);
    pollTimeout = null;
  }
  isPollingActive = false;
}































































































































// import axios from "axios";
// import { machineIdSync } from "node-machine-id";
// import { Timer, User } from "../../types";
// import { configDotenv } from "../utils/configDotenv";
 

// configDotenv();

// const DEVICE_ID = machineIdSync(true);
// const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
// const STATUS_POLL_MS = parseInt(process.env.STATUS_POLL_SECONDS || "30", 10) * 1000;

// export async function pollTimerState(
//   user: User,
//   onTimerUpdate: (running: Timer) => void
// ) {
//   if (!user.jwt) return;

//   try {
//     const { data } = await axios.get(
//       `${BACKEND_BASE_URL}/api/v1/timer/agent/timer-status`,
//       {
//         headers: { Authorization: `${user.jwt}` },
//         timeout: 10000,
//       }
//     );

//     console.log("POLL TIMER DATA", data);

//     if (data?.timer) {
//       // Timer is running — update normally
//       onTimerUpdate(data.timer);
//     } else {
//       // No timer running — send a default empty timer
//       onTimerUpdate({
//         _id: "",
//         isRunning: false,
//         startTime: "",
//         task: "",
//         department: "",
//         clientName: "",
//       });
//     }
//   } catch (e) {
//     console.log("Error in pollTimerState", e);
//   } finally {
//     setTimeout(() => pollTimerState(user, onTimerUpdate), STATUS_POLL_MS);
//   }
// }
