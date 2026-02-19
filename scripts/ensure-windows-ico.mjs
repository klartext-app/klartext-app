import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "src-tauri", "icons");
const icoPath = path.join(iconsDir, "icon.ico");
const png32 = path.join(iconsDir, "32x32.png");

if (!fs.existsSync(png32)) {
  console.error("Fehler: 32x32.png nicht gefunden in", iconsDir);
  process.exit(1);
}

const buf = await pngToIco(fs.readFileSync(png32));
fs.writeFileSync(icoPath, buf);
console.log("icon.ico erzeugt:", icoPath);
