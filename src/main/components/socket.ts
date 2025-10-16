



import { machineIdSync } from "node-machine-id";
import { io, Socket } from "socket.io-client";
import { Timer, User } from "../../types";
import { configDotenv } from "../utils/configDotenv";

configDotenv();

const DEVICE_ID = machineIdSync(true);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;

let socket: Socket | null = null;

/**
 * Connects to the backend socket server for real-time timer updates.
 */
export function connectSocket(
  { jwt, id }: User,
  onTimerUpdate: (timer: Timer) => void
) {
  // If already connected, don’t reconnect
  if (socket && socket.connected) return socket;

  try {
    socket = io(BACKEND_BASE_URL, {
      transports: ["websocket"],
      auth: { token: jwt },
      query: { deviceId: DEVICE_ID },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
      socket.emit("agent:subscribe", { id, deviceId: DEVICE_ID });
    });

    socket.on("disconnect", (reason) => {
      console.log("⚠️ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socket.on("timer:state", (timer: Timer) => {
      if (timer?.isRunning) {
        onTimerUpdate(timer);
      } else {
        onTimerUpdate({
          _id: "",
          isRunning: false,
          startTime: "",
          department: "",
          clientName: "",
          task: "",
        });
      }
    });
  } catch (e) {
    console.error("Socket setup error:", e);
  }

  return socket;
}

/**
 * Gracefully disconnects the socket (used on logout).
 */
export function disconnectSocket() {
  if (socket) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
    socket = null;
  }
}

































































// import { machineIdSync } from "node-machine-id";
// import { io, Socket } from "socket.io-client";
// import { Timer, User } from "../../types";
// import { configDotenv } from "../utils/configDotenv";

// const DEVICE_ID = machineIdSync(true);
// configDotenv();

// const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
// const URL = `${BACKEND_BASE_URL}`;

// export function connectSocket(
//   { jwt, id }: User,
//   onTimerUpdate: (timer: Timer) => void
// ) {
//   let socket: Socket;

//   try {
//     if (socket) socket.disconnect();

//     socket = io(BACKEND_BASE_URL, {
//       transports: ["websocket"],
//     });

//     socket.on("connect", () => {
//       socket?.emit("agent:subscribe", { id });
//     });

//     socket.on("timer:state", (timer: Timer) => {
//       if (timer.isRunning) {
//         onTimerUpdate(timer); // 🔥 call back to update your main state
//       } else {
//         onTimerUpdate({
//           _id: "",
//           isRunning: false,
//           startTime: "",
//           department: "",
//           clientName: "",
//           task: "",
//         });
//       }
//     });
//   } catch (e) {
//     console.error("Socket error:", e);
//   }

//   return socket;
// }
