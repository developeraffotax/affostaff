import axios from "axios";
import fs from "fs";
import path from "path";
import { machineIdSync } from "node-machine-id";
import screenshot from "screenshot-desktop";
import { app } from "electron";
import FormData from "form-data";
import { ActiveWindow,  ActivitySummary, ScreenshotMeta, User } from "../../types";
import { getActiveWindowActivity } from "./activeWindow";
 

const DEVICE_ID = machineIdSync(true);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:5000";


const QUEUE_DIR = path.join(app.getPath("userData"), "queue");
if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });

/**
 * Takes a screenshot and uploads it to the backend (or queues it on failure).
 */


export async function takeAndUploadScreenshot(user: User, activity: ActivitySummary): Promise<void> {
  const { jwt, id } = user;

  if (!jwt ) {
    console.log("[Screenshot] Skipping — missing JWT");
    return;
  }

  const ts = Date.now();
  const tmpFile = path.join(app.getPath("temp"), `affotax-${ts}.jpg`);


 

  try {
    console.log(`[Screenshot] Capturing to: ${tmpFile}`);
    
    // ✅ Capture as buffer (does NOT create any extra file)
    const img = await screenshot({ format: "jpg" });

    // ✅ Write buffer manually to your desired file path
    fs.writeFileSync(tmpFile, img);

    const meta: ScreenshotMeta = {
      userId: id,
      timestamp: new Date(ts).toISOString(),
      deviceId: DEVICE_ID,
    };


    const activeWindow = getActiveWindowActivity();


    const data = {
      activeWindow,
      activity,
    }
     

    await uploadWithRetry(tmpFile, meta, data,  jwt);
    console.log("[Screenshot] Upload successful");
  } catch (err) {
    console.error("[Screenshot] Capture or upload failed:", err);
    if (fs.existsSync(tmpFile)) {
      const meta: ScreenshotMeta = {
      userId: id,
      timestamp: new Date(ts).toISOString(),
      deviceId: DEVICE_ID,
    };

    const activeWindow = getActiveWindowActivity();


    const data = {
      activeWindow,
      activity,
    }

      queueFile(tmpFile, meta, data );
    } else {
      console.warn("[Screenshot] Skipped queueing — screenshot file not found:", tmpFile);
    }
  }
}











/**
 * Uploads a screenshot file with exponential retry and fallback to queue on failure.
 */
async function uploadWithRetry(filePath: string, meta: any, data: {activeWindow?: ActiveWindow, activity?: ActivitySummary}, jwt: string, attempt = 0): Promise<void> {
  const fd = new FormData();
  fd.append("userId", meta.userId);
  fd.append("timestamp", meta.timestamp);
  fd.append("deviceId", meta.deviceId || DEVICE_ID);
  fd.append("screenshot", fs.createReadStream(filePath));

  if (data.activeWindow) {
    fd.append("activeWindow", JSON.stringify(data.activeWindow));
  }
  if (data.activity) {
    fd.append("activity", JSON.stringify(data.activity));
  }

  try {
    await axios.post(`${BACKEND_BASE_URL}/api/v1/agent/screenshot`, fd, {
      headers: { Authorization: jwt, ...fd.getHeaders() },
      timeout: 30000,
      maxBodyLength: Infinity,
    });

    fs.unlinkSync(filePath);
    console.log(`[Upload] Success: ${path.basename(filePath)}`);
  } catch (err) {
    console.warn(`[Upload] Attempt ${attempt + 1} failed:`, err.message || err);

    if (attempt < 3) {
      const backoff = Math.min(60000, 2000 * Math.pow(2, attempt));
      console.log(`[Upload] Retrying in ${backoff / 1000}s...`);
      setTimeout(() => uploadWithRetry(filePath, meta, data, jwt, attempt + 1), backoff);
    } else {
      console.log("[Upload] Max retries reached — queueing file.");
      queueFile(filePath, meta, data);
    }
  }
}
















/**
 * Saves a failed screenshot upload locally for retry later.
 */
function queueFile(filePath: string, meta: any, data: {activeWindow?: ActiveWindow, activity?: ActivitySummary}, ): void {
  try {
    const fileName = `${meta.timestamp}-${path.basename(filePath)}`;
    const dest = path.join(QUEUE_DIR, fileName);

    fs.copyFileSync(filePath, dest);
     // Combine meta and data into one structured JSON object
    const payload = {
      meta,
      data,
      queuedAt: new Date().toISOString(),
    };

    // Save metadata + activity info
    fs.writeFileSync(dest + ".json", JSON.stringify(payload, null, 2));
    
    fs.unlinkSync(filePath);

    console.log(`[Queue] Saved file: ${fileName}`);
  } catch (err) {
    console.error("[Queue] Failed to save queued file:", err);
  }
}


















/**
 * Attempts to flush queued screenshots by uploading them.
 */
export async function flushQueue(user: User): Promise<void> {
  const { jwt, id } = user;
  if (!jwt) return;

  const files = fs.readdirSync(QUEUE_DIR).filter((f) => /\.(jpg|png)$/i.test(f));

  for (const file of files) {
    const imgPath = path.join(QUEUE_DIR, file);
    const payloadPath = imgPath + ".json";

    let meta = { userId: id, timestamp: new Date().toISOString(), deviceId: DEVICE_ID };
    let data: {activeWindow?: ActiveWindow, activity?: ActivitySummary} = null;

    // 🧩 Read payload (meta + data)
    if (fs.existsSync(payloadPath)) {
      try {
        const payloadRaw = fs.readFileSync(payloadPath, "utf8");
        const payload = JSON.parse(payloadRaw);

        if (payload.meta) meta = payload.meta;
        if (payload.data) data = payload.data;
      } catch (err) {
        console.warn(`[Queue] ⚠️ Could not read payload for ${file}:`, err);
      }
    } else {
      console.warn(`[Queue] ⚠️ No payload found for ${file}`);
    }

    try {
      // ✅ uploadWithRetry supports extra context data
      await uploadWithRetry(imgPath, meta,data, jwt,);

      // Clean up only after successful upload
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      if (fs.existsSync(payloadPath)) fs.unlinkSync(payloadPath);

      console.log(`[Queue] ✅ Flushed queued file: ${file}`);
    } catch (err) {
      console.error(`[Queue] ❌ Failed to upload queued file: ${file}`, err);
    }
  }

  // Schedule next flush after 1 minute
  setTimeout(() => flushQueue(user), 60000);
}
