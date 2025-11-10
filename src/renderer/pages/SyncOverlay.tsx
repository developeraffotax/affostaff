import { useEffect, useState } from "react";
 

export default function SyncOverlay() {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

 useEffect(() => {
    // Listen for timer updates from main process
    const unsub = window.agent.onTimeLeftToClose((data) => {
      setVisible(data.active);
      setSecondsLeft(data.secondsLeft);
      
    });

    // Cleanup listener
    return () => unsub();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white z-[9999]">
      <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full mb-4" />
      <p className="text-lg font-semibold mb-2">Syncing your last data...</p>
      <p className="text-sm text-gray-300">Closing in {secondsLeft}s</p>
    </div>
  );
}
