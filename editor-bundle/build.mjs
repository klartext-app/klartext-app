import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, "..", "KlartextSwift", "Resources", "editor", "codemirror.bundle.js");
const watching = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: [path.join(__dirname, "editor.mjs")],
  bundle: true,
  outfile: outFile,
  format: "iife",
  globalName: "KlartextEditor",
  minify: !watching,
  sourcemap: watching ? "inline" : false,
  logLevel: "info",
});

if (watching) {
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("Bundle written to", outFile);
}
