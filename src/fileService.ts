/**
 * Datei öffnen/speichern – nur in der Tauri-Desktop-App verfügbar.
 */

function isTauri(): boolean {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

export interface OpenResult {
  path: string;
  content: string;
}

export async function openFile(): Promise<OpenResult | null> {
  if (!isTauri()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  const { readTextFile } = await import("@tauri-apps/plugin-fs");
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [
      { name: "Alle Dateien", extensions: ["*"] },
      { name: "JSON", extensions: ["json"] },
      { name: "XML", extensions: ["xml", "xsl"] },
      { name: "YAML", extensions: ["yaml", "yml"] },
      { name: "Text", extensions: ["txt"] },
    ],
  });
  if (selected === null || Array.isArray(selected)) return null;
  const content = await readTextFile(selected);
  return { path: selected, content };
}

export async function saveFile(filePath: string | null, content: string): Promise<string | null> {
  if (!isTauri()) return null;
  const { save } = await import("@tauri-apps/plugin-dialog");
  const { writeTextFile } = await import("@tauri-apps/plugin-fs");
  let path = filePath;
  if (!path) {
    const selected = await save({
      filters: [
        { name: "Alle Dateien", extensions: ["*"] },
        { name: "JSON", extensions: ["json"] },
        { name: "XML", extensions: ["xml"] },
        { name: "YAML", extensions: ["yaml", "yml"] },
        { name: "Text", extensions: ["txt"] },
      ],
    });
    if (selected == null) return null;
    path = selected;
  }
  await writeTextFile(path, content);
  return path;
}

export function getFileName(path: string): string {
  const sep = path.includes("\\") ? "\\" : "/";
  const parts = path.split(sep);
  return parts[parts.length - 1] || "Unbenannt";
}

export { isTauri as isTauriEnv };
