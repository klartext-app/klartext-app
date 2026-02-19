import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
// Version aus Argument oder Environment Variable, oder Tag-Name ohne 'v' Prefix
let version = process.env.VERSION || process.argv[2];

// Falls Tag-Format (z.B. "v0.1.5"), entferne das 'v'
if (version && version.startsWith("v")) {
  version = version.slice(1);
}

if (!version) {
  console.error("Usage: node scripts/update-version.mjs <version>");
  console.error("Or set VERSION environment variable");
  process.exit(1);
}

// Update package.json
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
packageJson.version = version;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

// Update tauri.conf.json
const tauriConfPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));
tauriConf.version = version;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");

console.log(`Version updated to ${version} in package.json and tauri.conf.json`);
