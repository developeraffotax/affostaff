 
import { ActivitySummary, KeyboardActivity, MouseActivity } from "../../types";
import { configDotenv } from "../utils/configDotenv";

configDotenv();

const SCREENSHOT_INTERVAL_SECONDS = parseInt(process.env.SCREENSHOT_INTERVAL_SECONDS) || 300; // default to 5 minutes




const MAX_KEY_EVENTS = SCREENSHOT_INTERVAL_SECONDS;   // define upper expected bound per 5 min
const MAX_MOUSE_EVENTS = SCREENSHOT_INTERVAL_SECONDS; // define upper expected bound per 5 min


export const getActivity = (keyboardActivity: KeyboardActivity[], mouseActivity: MouseActivity[]): ActivitySummary => {




const keyboardCount = keyboardActivity.length;
const mouseCount = mouseActivity.length;


const keyboardActivityPercent = Math.round(Math.min(100, (keyboardCount / MAX_KEY_EVENTS) * 100));
const mouseActivityPercent = Math.round(Math.min(100, (mouseCount / MAX_MOUSE_EVENTS) * 100));


// Combine them — you can weight typing slightly higher if you want
const overallActivityPercent = Math.round((keyboardActivityPercent * 0.5 + mouseActivityPercent * 0.5));

const summary = {
  keyboardCount,
  mouseCount,
  keyboardActivityPercent,
  mouseActivityPercent,
  overallActivityPercent,
  period: "5min",
  startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  endedAt: new Date().toISOString(),
};


     return summary;

}   