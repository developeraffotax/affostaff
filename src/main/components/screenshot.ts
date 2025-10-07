import axios from "axios";
import fs from "fs";
import path from "path";
import { machineIdSync } from "node-machine-id";
import screenshot from "screenshot-desktop";
import { app } from "electron";
import FormData from "form-data";
import { User } from "../../types";

const DEVICE_ID = machineIdSync(true);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;
const STATUS_POLL_MS = parseInt(process.env.STATUS_POLL_MS || "10000", 10);
const SCREENSHOT_INTERVAL_MS = parseInt(
  process.env.SCREENSHOT_INTERVAL_MS || "300000",
  10
);

 const QUEUE_DIR = path.join(app.getPath('userData'), 'queue');
 if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });



 
export async function takeAndUploadScreenshot({jwt, email} : User, timerRunning: boolean) {
  if (!jwt || !timerRunning) {
    setTimeout(takeAndUploadScreenshot, SCREENSHOT_INTERVAL_MS);
    return;
  }
  const ts = Date.now();
  const tmp = path.join(app.getPath("temp"), `affotax-${ts}.jpg`);
  try {
    await screenshot({ filename: tmp });
    // const active = await activeWin().catch(() => null);
    const meta = {
      email,
      deviceId: DEVICE_ID,
      timestamp: new Date(ts).toISOString(),
    //   activeWindow: active?.title || null,
    //   app: active?.owner?.name || null,
    };
    await uploadWithRetry(tmp, meta, jwt);
  } catch (e) {
    queueFile(tmp, { email, deviceId: DEVICE_ID, timestamp: ts });
  } finally {
    setTimeout(takeAndUploadScreenshot, SCREENSHOT_INTERVAL_MS);
  }
}











async function uploadWithRetry(filePath: string, meta: any, jwt:string,  attempt = 0) {
  const fd = new FormData();
  fd.append("email", meta.email);
  fd.append("deviceId", meta.deviceId);
  fd.append("timestamp", meta.timestamp);
  fd.append("activeWindow", meta.activeWindow || "");
  fd.append("app", meta.app || "");
  fd.append("screenshot", fs.createReadStream(filePath));
  try {
    await axios.post(`${BACKEND_BASE_URL}/api/agent/screenshot`, fd, {
      headers: { Authorization: `Bearer ${jwt}`, ...fd.getHeaders() },
      timeout: 30000,
      maxBodyLength: Infinity,
    });
    try {
      fs.unlinkSync(filePath);
    } catch {
        console.log("Error in uploadWithRetry", )
    }

  } catch (e) {
    if (attempt < 3) {
      const backoff = Math.min(60000, 2000 * Math.pow(2, attempt));
      setTimeout(() => uploadWithRetry(filePath, meta, jwt, attempt + 1), backoff);
    } else {
      queueFile(filePath, meta);
    }
  }
}


function queueFile(filePath: string, meta: any) {
  try {
    const dest = path.join(
      QUEUE_DIR,
      `${meta.timestamp}-$
 {path.basename(filePath)}`
    );
    fs.copyFileSync(filePath, dest);
    fs.writeFileSync(dest + ".json", JSON.stringify(meta));
    try {
      fs.unlinkSync(filePath);
    } catch {
        console.log("error in queueFile")
    }
  } catch(e) {
    console.log("Error in queueFile", e)
  }
}



export async function flushQueue({jwt, email}: User) {
  if (!jwt) return;
  const files = fs.readdirSync(QUEUE_DIR).filter((f) => /\.(jpg|png)$/.test(f));
  for (const f of files) {
    const img = path.join(QUEUE_DIR, f);
    const metaPath = img + ".json";
    let meta = {
      email,
      deviceId: DEVICE_ID,
      timestamp: new Date().toISOString(),
    };
    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
      } catch {
        console.log("error in flushQueue")
      }
    }
    try {
      await uploadWithRetry(img, meta, jwt);
      try {
        fs.unlinkSync(metaPath);
      } catch {
        console.log("error in flushuqure")
      }
    } catch(e) {
        console.log("Error in flushQueue", e)
    }
  }
  setTimeout(flushQueue, 60000);
}
