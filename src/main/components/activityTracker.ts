// import { GlobalKeyboardListener } from "node-global-key-listener";

// let lastActivity: number = Date.now();
// let totalActiveMs = 0;
// let keystrokeCount = 0;
// let startTime: number = Date.now();

// // Create keyboard listener instance
// const keyboard = new GlobalKeyboardListener();

// /**
//  * Marks the user's recent activity.
//  * If idle >10s, resets baseline; otherwise adds active duration.
//  */
// function markActivity() {
//   const now = Date.now();
//   if (now - lastActivity > 10_000) {
//     // User was idle more than 10 seconds
//     lastActivity = now;
//   } else {
//     totalActiveMs += now - lastActivity;
//     lastActivity = now;
//   }
// }

// /**
//  * Start listening to global keyboard events
//  */
// export function startActivityMonitor() {
//   keyboard.addListener((event) => {
//     // event.state is "DOWN" or "UP"
//     if (event.state === "DOWN") {
//       keystrokeCount++;
//       markActivity();
//     }
//   });

//   console.log("[ActivityMonitor] Global keyboard listener started");
// }

// /**
//  * Returns snapshot of recent activity & resets counters
//  */
// export function getActivitySnapshot() {
//   const now = Date.now();
//   const totalTime = now - startTime;
//   const activityPercent = totalTime > 0 ? (totalActiveMs / totalTime) * 100 : 0;

//   const snapshot = {
//     keystrokes: keystrokeCount,
//     mouseEvents: 0, // you can add mouse tracking later
//     totalActiveMs,
//     totalTime,
//     activityPercent: Number(activityPercent.toFixed(2)),
//   };

//   // Reset counters for next period
//   keystrokeCount = 0;
//   totalActiveMs = 0;
//   startTime = now;
//   lastActivity = now;

//   return snapshot;
// }
