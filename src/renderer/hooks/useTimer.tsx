import { useEffect, useState } from "react";
import { Timer } from "../../types";

export function useTimer() {
  const [timer, setTimer] = useState<Timer>({
    _id: "",
    isRunning: false,
    startTime: "",

    task: "",
    department: "",
    clientName: "",
  });

  useEffect(() => {
    // Listen for timer updates from main process
    const unsub = window.agent.onTimerUpdate((data) => {
      setTimer(data);
      console.log("Timer updated from main:", data);
    });

    // Cleanup listener
    return () => unsub();
  }, []);

  return timer;
}
