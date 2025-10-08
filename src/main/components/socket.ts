import { machineIdSync } from "node-machine-id";
import { io, Socket } from "socket.io-client";
import { Timer, User } from "../../types";
import { configDotenv } from "../utils/configDotenv";

const DEVICE_ID = machineIdSync(true);
configDotenv();

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
const URL = `${BACKEND_BASE_URL}`;

export function connectSocket(
  { jwt, id }: User,
  onTimerUpdate: (timer: Timer) => void
) {
  let socket: Socket;

  try {
    if (socket) socket.disconnect();

    socket = io(BACKEND_BASE_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket?.emit("agent:subscribe", { id });
    });

    socket.on("timer:state", (timer: Timer) => {
      if (timer.isRunning) {
        onTimerUpdate(timer); // 🔥 call back to update your main state
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
    console.error("Socket error:", e);
  }

  return socket;
}
