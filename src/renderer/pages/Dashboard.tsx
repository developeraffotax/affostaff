import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Timer, User } from "../../types";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";

export default function Dashboard({
  timer,
  user,
   
}: {
  timer: Timer;
  user: User;
   
}) {
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState("00:00:00");

  // calculate elapsed time
  useEffect(() => {
    if (!timer?.startTime) return;

    const updateElapsed = () => {
      const start = new Date(timer.startTime).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, "0");
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
      const s = (diff % 60).toString().padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [timer.startTime]);

 

  return (
    <div className=" w-full bg-gray-50 flex flex-col items-center justify-between   shadow-xl overflow-hidden">
      {/* --- Top Section: Timer --- */}
      <div className="flex flex-col items-center justify-start w-full bg-gradient-to-br from-blue-600 to-blue-400 text-white py-8 space-y-3">
        <div className="text-4xl font-mono font-semibold">{elapsed}</div>
        <button
          className={`flex items-center justify-center w-14 h-14 rounded-full transition shadow-md ${
            timer.isRunning
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          }`}
          title={timer.isRunning ? "Running" : "Paused"}
        >
          {timer.isRunning ? (
            <FaPlay className="text-xl" />
          ) : (
            <FaStop className="text-xl" />
          )}
        </button>
        <div className="text-xs opacity-90">
          {timer.startTime
            ? `Started: ${new Date(timer.startTime).toLocaleTimeString()}`
            : "No active timer"}
        </div>
      </div>

      {/* --- Middle Section: User Info --- */}
      {/* <div className="flex flex-col items-center justify-center w-full py-6 border-b border-gray-100 bg-white">
        <h2 className="text-lg font-semibold text-gray-800">
          {user.name || "User"}
        </h2>
        <p className="text-sm text-gray-500">{user.email}</p>
        <button
          onClick={handleLogout}
          className="mt-3 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition"
        >
          Logout
        </button>
      </div> */}

      {/* --- Bottom Section: Task Info --- */}
      {timer.isRunning && (<div className="flex flex-col justify-center w-full bg-white py-6 px-6 space-y-3">
        <div>
          <p className="text-gray-500 text-sm">Task</p>
          <p className="text-gray-800 font-medium text-base">
            {timer.task || "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Client</p>
          <p className="text-gray-800 font-medium text-base">
            {timer.clientName || "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-sm">Department</p>
          <p className="text-gray-800 font-medium text-base">
            {timer.department || "—"}
          </p>
        </div>
      </div>)}
    </div>
  );
}
