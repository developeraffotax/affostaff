import { desktopCapturer } from "electron";
import fs from "fs";

export async function takeScreenshot(savePath: any) {
  const sources = await desktopCapturer.getSources({ types: ["screen"] });
 
  const screen = sources[0];
  const image = screen.thumbnail.toJPEG(80);
  fs.writeFileSync(savePath, image);
}