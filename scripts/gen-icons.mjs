import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "src-tauri", "icons");

// 32x32 PNG (dunkelgrau, für Klartext)
const png32 = await sharp({
  create: { width: 32, height: 32, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 1 } },
})
  .png()
  .toBuffer();

fs.mkdirSync(iconsDir, { recursive: true });
fs.writeFileSync(path.join(iconsDir, "32x32.png"), png32);
fs.writeFileSync(path.join(iconsDir, "128x128.png"), await sharp(png32).resize(128, 128).png().toBuffer());
fs.writeFileSync(path.join(iconsDir, "128x128@2x.png"), await sharp(png32).resize(256, 256).png().toBuffer());

const ico = await pngToIco(png32);
fs.writeFileSync(path.join(iconsDir, "icon.ico"), ico);

console.log("Icons erzeugt: 32x32.png, 128x128.png, 128x128@2x.png, icon.ico");
