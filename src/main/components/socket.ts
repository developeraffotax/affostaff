import { machineIdSync } from "node-machine-id";
import { io, Socket } from "socket.io-client";
import {  User } from "../../types";

const DEVICE_ID = machineIdSync(true);

export function connectSocket({ jwt, email}: User, onTimerUpdate : (running: boolean) => void ) {
  let socket: Socket;

  try {
    if (socket) socket.disconnect();

    socket = io(process.env.BACKEND_BASE_URL, {
      path: "/socket",
      auth: { token: jwt },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket?.emit("agent:subscribe", { email, deviceId: DEVICE_ID });
    });

    socket.on("timer:state", (payload: {running: boolean, }) => {
      const running = !!payload?.running;
      onTimerUpdate(running); // 🔥 call back to update your main state
    });
  } catch (e) {
    console.error("Socket error:", e);
  }

  return socket;
}
