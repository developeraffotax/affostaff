import axios from "axios";
import fs from "fs";
import path from "path";
import { machineIdSync } from "node-machine-id";
import screenshot from "screenshot-desktop";
import { app } from "electron";
import FormData from "form-data";
import { User } from "../../types";

const DEVICE_ID = machineIdSync(true);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:5000";
const STATUS_POLL_MS = parseInt(process.env.STATUS_POLL_MS || "10000", 10);
const SCREENSHOT_INTERVAL_MS = parseInt(process.env.SCREENSHOT_INTERVAL_MS || "300000", 10);

const QUEUE_DIR = path.join(app.getPath("userData"), "queue");
if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });

/**
 * Takes a screenshot and uploads it to the backend (or queues it on failure).
 */


export async function takeAndUploadScreenshot(user: User, timerRunning: boolean) {
  const { jwt, id } = user;

  if (!jwt || !timerRunning) {
    console.log("[Screenshot] Skipping — timer not running or missing JWT");
    return;
  }

  const ts = Date.now();
  const tmpFile = path.join(app.getPath("temp"), `affotax-${ts}.jpg`);


  console.log("DEICE ID IS", DEVICE_ID);

  try {
    console.log(`[Screenshot] Capturing to: ${tmpFile}`);
    
    // ✅ Capture as buffer (does NOT create any extra file)
    const img = await screenshot({ format: "jpg" });

    // ✅ Write buffer manually to your desired file path
    fs.writeFileSync(tmpFile, img);

    const meta = {
      userId: id,
      timestamp: new Date(ts).toISOString(),
      deviceId: DEVICE_ID,
    };

    await uploadWithRetry(tmpFile, meta, jwt);
    console.log("[Screenshot] Upload successful");
  } catch (err) {
    console.error("[Screenshot] Capture or upload failed:", err);
    if (fs.existsSync(tmpFile)) {
      queueFile(tmpFile, { userId: id, timestamp: new Date(ts).toISOString() });
    } else {
      console.warn("[Screenshot] Skipped queueing — screenshot file not found:", tmpFile);
    }
  }
}











/**
 * Uploads a screenshot file with exponential retry and fallback to queue on failure.
 */
async function uploadWithRetry(filePath: string, meta: any, jwt: string, attempt = 0): Promise<void> {
  const fd = new FormData();
  fd.append("userId", meta.userId);
  fd.append("timestamp", meta.timestamp);
  fd.append("deviceId", meta.deviceId || DEVICE_ID);
  fd.append("screenshot", fs.createReadStream(filePath));

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
      setTimeout(() => uploadWithRetry(filePath, meta, jwt, attempt + 1), backoff);
    } else {
      console.log("[Upload] Max retries reached — queueing file.");
      queueFile(filePath, meta);
    }
  }
}
















/**
 * Saves a failed screenshot upload locally for retry later.
 */
function queueFile(filePath: string, meta: any) {
  try {
    const fileName = `${meta.timestamp}-${path.basename(filePath)}`;
    const dest = path.join(QUEUE_DIR, fileName);

    fs.copyFileSync(filePath, dest);
    fs.writeFileSync(dest + ".json", JSON.stringify(meta, null, 2));
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

  const files = fs.readdirSync(QUEUE_DIR).filter((f) => /\.(jpg|png)$/.test(f));

  for (const file of files) {
    const imgPath = path.join(QUEUE_DIR, file);
    const metaPath = imgPath + ".json";

    let meta = { userId: id, timestamp: new Date().toISOString(), deviceId: DEVICE_ID };

    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      } catch {
        console.warn(`[Queue] Could not read meta for ${file}`);
      }
    }

    try {
      await uploadWithRetry(imgPath, meta, jwt);
      fs.unlinkSync(metaPath);
      console.log(`[Queue] Flushed file: ${file}`);
    } catch (err) {
      console.error(`[Queue] Failed to upload queued file: ${file}`, err);
    }
  }

  // Schedule next flush
  setTimeout(() => flushQueue(user), 60000);
}
