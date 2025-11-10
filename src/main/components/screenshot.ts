import axios from "axios";
import fs from "fs";
import path from "path";
import { machineIdSync } from "node-machine-id";
import screenshot from "screenshot-desktop";
import { app } from "electron";
import { ActiveWindow, ActivitySummary, ScreenshotMeta, User } from "../../types";
import { getActiveWindowActivity } from "./activeWindow";

const DEVICE_ID = machineIdSync(true);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || "http://localhost:5000";

const QUEUE_DIR = path.join(app.getPath("userData"), "queue");
if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });

/**
 * Main entry point — capture screenshot, get presigned URL, upload, and send metadata.
 */
export async function takeAndUploadScreenshot(user: User, activity: ActivitySummary): Promise<void> {
  const { jwt, id } = user;
  if (!jwt) {
    console.log("[Screenshot] Skipping — missing JWT");
    return;
  }

  try {
    // 1️⃣ Request presigned URL and timestamp from backend
    const presignRes = await axios.get(`${BACKEND_BASE_URL}/api/v1/agent/presigned-url`, {
      params: { fileName: "affotax.jpg", fileType: "image/jpeg" },
      headers: { Authorization: jwt },
    });

    const { uploadUrl, key, ts } = presignRes.data;
    const tmpFile = path.join(app.getPath("temp"), `affotax-${ts}.jpg`);

    // 2️⃣ Capture screenshot locally
    console.log(`[Screenshot] Capturing to: ${tmpFile}`);
    const img = await screenshot({ format: "jpg" });
    fs.writeFileSync(tmpFile, img);

    // 3️⃣ Build metadata
    const meta: ScreenshotMeta = {
      userId: id,
      timestamp: new Date(ts).toISOString(),
      deviceId: DEVICE_ID,
      s3Key: key,
    };

    const activeWindow = getActiveWindowActivity();
    const data = { activeWindow, activity };

    // 4️⃣ Upload via presigned URL (with retry & queue fallback)
    await uploadWithRetry(uploadUrl, tmpFile, meta, data, jwt, 0);
    console.log("[Screenshot] Upload successful");

    // 5️⃣ Delete local temp file
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  } catch (err) {
    console.error("[Screenshot] Capture or upload failed:", err.message || err);
  }
}

/**
 * Uploads file to Wasabi using presigned URL.
 * Retries exponentially and queues file if all attempts fail.
 */
async function uploadWithRetry(
  uploadUrl: string,
  filePath: string,
  meta: ScreenshotMeta,
  data: { activeWindow?: ActiveWindow; activity?: ActivitySummary },
  jwt: string,
  attempt = 0
): Promise<void> {
  try {
    // PUT file directly to Wasabi
    await axios.put(uploadUrl, fs.readFileSync(filePath), {
      headers: { "Content-Type": "image/jpeg" },
      timeout: 30000,
      maxBodyLength: Infinity,
    });

    // Then notify backend (so BullMQ can process metadata)
    await axios.post(`${BACKEND_BASE_URL}/api/v1/agent/screenshot`, { ...meta, ...data }, {
      headers: { Authorization: jwt },
    });

    console.log(`[Upload] ✅ Success: ${path.basename(filePath)}`);
  } catch (err) {
    console.warn(`[Upload] ❌ Attempt ${attempt + 1} failed: ${err.message || err}`);

    if (attempt < 3) {
      const backoff = Math.min(60000, 2000 * Math.pow(2, attempt));
      console.log(`[Upload] Retrying in ${backoff / 1000}s...`);
      await new Promise((res) => setTimeout(res, backoff));
      return uploadWithRetry(uploadUrl, filePath, meta, data, jwt, attempt + 1);
    }

    console.log("[Upload] ⚠️ Max retries reached — queueing file for later.");
    queueFile(filePath, meta, data);
  }
}

/**
 * Queues screenshot + metadata if upload fails.
 */
function queueFile(
  filePath: string,
  meta: ScreenshotMeta,
  data: { activeWindow?: ActiveWindow; activity?: ActivitySummary }
): void {
  try {
    const fileName = `${meta.timestamp}-${path.basename(filePath)}`;
    const dest = path.join(QUEUE_DIR, fileName);
    fs.copyFileSync(filePath, dest);

    const payload = {
      meta,
      data,
      queuedAt: new Date().toISOString(),
    };
    fs.writeFileSync(dest + ".json", JSON.stringify(payload, null, 2));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    console.log(`[Queue] 💾 Saved file for retry: ${fileName}`);
  } catch (err) {
    console.error("[Queue] ❌ Failed to save queued file:", err);
  }
}

/**
 * Attempts to flush queued screenshots every minute.
 */
export async function flushQueue(user: User, options = { immediate: false }) {
  const { jwt } = user;
  if (!jwt) {
    console.log("[Queue] ⏸️ Skipping flush — user logged out.");
    return;
  }

  const files = fs.readdirSync(QUEUE_DIR).filter((f) => /\.(jpg|png)$/i.test(f));
  for (const file of files) {
    const imgPath = path.join(QUEUE_DIR, file);
    const payloadPath = imgPath + ".json";

    if (!fs.existsSync(payloadPath)) continue;

    try {
      const payloadRaw = fs.readFileSync(payloadPath, "utf8");
      const { meta, data } = JSON.parse(payloadRaw);

      const presignRes = await axios.get(`${BACKEND_BASE_URL}/api/v1/agent/presigned-url`, {
        params: { fileName: "retry.jpg", fileType: "image/jpeg" },
        headers: { Authorization: jwt },
      });

      const { uploadUrl, key, ts } = presignRes.data;
      meta.timestamp = new Date(ts).toISOString();
      meta.s3Key = key;

      await uploadWithRetry(uploadUrl, imgPath, meta, data, jwt, 0);

      fs.unlinkSync(imgPath);
      fs.unlinkSync(payloadPath);
      console.log(`[Queue] ✅ Flushed: ${file}`);
    } catch (err) {
      console.error(`[Queue] ❌ Failed to flush ${file}:`, err.message || err);
    }
  }

  // 🚫 Only schedule next flush if not immediate
  if (!options.immediate) {
    setTimeout(() => flushQueue(user), 60000);
  }
}

