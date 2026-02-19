import https from "https";
import crypto from "crypto";

const VERSION = process.argv[2] || "0.1.6";
const REPO = "klartext-app/klartext-app";

const files = [
  { arch: "aarch64", name: `Klartext_${VERSION}_aarch64.dmg` },
  { arch: "x86_64", name: `Klartext_${VERSION}_x86_64.dmg` },
];

function downloadAndHash(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        return;
      }
      const hash = crypto.createHash("sha256");
      res.on("data", (chunk) => hash.update(chunk));
      res.on("end", () => resolve(hash.digest("hex")));
      res.on("error", reject);
    }).on("error", reject);
  });
}

console.log(`Berechne SHA256 für Version ${VERSION}...\n`);

const hashes = {};
for (const file of files) {
  const url = `https://github.com/${REPO}/releases/download/v${VERSION}/${file.name}`;
  try {
    console.log(`Lade ${file.name}...`);
    const sha256 = await downloadAndHash(url);
    hashes[file.arch] = sha256;
    console.log(`✓ ${file.arch}: ${sha256}\n`);
  } catch (e) {
    console.error(`✗ Fehler bei ${file.name}:`, e.message);
    console.error(`  URL: ${url}\n`);
  }
}

if (Object.keys(hashes).length === 2) {
  console.log("\n=== Cask-Update für homebrew-klartext ===\n");
  console.log(`Version: ${VERSION}\n`);
  console.log(`SHA256:`);
  console.log(`  arm:   "${hashes.aarch64}"`);
  console.log(`  intel: "${hashes.x86_64}"\n`);
  console.log("In Casks/klartext.rb im Repo homebrew-klartext eintragen:");
  console.log(`  version "${VERSION}"`);
  console.log(`  sha256 arm:   "${hashes.aarch64}",`);
  console.log(`         intel: "${hashes.x86_64}"`);
} else {
  console.log("\n⚠ Nicht alle Dateien konnten heruntergeladen werden.");
  console.log("Bitte prüfe, ob das Release v" + VERSION + " existiert und die .dmg-Dateien enthält.");
}
