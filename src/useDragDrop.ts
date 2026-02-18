import { useEffect } from "react";
import { getFileName } from "./fileService";

type TabFromDrop = {
  title: string;
  content: string;
  filePath: string | null;
  language: "plaintext" | "json" | "xml" | "yaml";
};

const ALLOWED_EXT = [".json", ".xml", ".xsl", ".yaml", ".yml", ".txt"];

function extToLanguage(ext: string): "plaintext" | "json" | "xml" | "yaml" {
  if (ext === "json") return "json";
  if (ext === "xml" || ext === "xsl") return "xml";
  if (ext === "yaml" || ext === "yml") return "yaml";
  return "plaintext";
}

export function useDragDrop(
  isTauri: boolean,
  onFilesDropped: (tabs: TabFromDrop[]) => void
) {
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | undefined;
    const setup = async () => {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      const { invoke } = await import("@tauri-apps/api/core");
      unlisten = await getCurrentWindow().onDragDropEvent(async (event) => {
        if (event.payload.type !== "drop" || !event.payload.paths?.length) return;
        const tabs: TabFromDrop[] = [];
        for (const path of event.payload.paths) {
          const ext = path.toLowerCase().slice(path.lastIndexOf("."));
          if (!ALLOWED_EXT.includes(ext)) continue;
          try {
            const content = await invoke<string>("read_dropped_file", { path });
            tabs.push({
              title: getFileName(path),
              content,
              filePath: path,
              language: extToLanguage(ext.slice(1).toLowerCase()),
            });
          } catch {
            // skip failed files
          }
        }
        if (tabs.length) onFilesDropped(tabs);
      });
    };
    setup();
    return () => unlisten?.();
  }, [isTauri, onFilesDropped]);
}
