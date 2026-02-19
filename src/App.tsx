import { useState, useCallback, useRef, useEffect } from "react";
import {
  FolderOpen,
  Save,
  FilePlus,
  Braces,
  CodeXml,
  FileCode,
  Minus,
  Trash2,
  GitCompare,
  PanelLeft,
  Download,
} from "lucide-react";
import { TitleBar } from "./TitleBar";
import { Editor, type EditorApi } from "./Editor";
import { DiffEditorView } from "./DiffEditorView";
import { DocumentOutline } from "./DocumentOutline";
import { Breadcrumbs } from "./Breadcrumbs";
import { StatusBar } from "./StatusBar";
import { openFile, saveFile, getFileName, isTauriEnv } from "./fileService";
import { useDragDrop } from "./useDragDrop";
import { usePersistedTabs } from "./usePersistedTabs";
import { getDocumentOutline, getPathAtLine } from "./outline";
import {
  formatJson,
  formatXml,
  formatYaml,
  minifyJson,
  minifyXml,
  minifyYaml,
} from "./formatters";

export interface Tab {
  id: string;
  title: string;
  content: string;
  filePath: string | null;
  language: "plaintext" | "json" | "xml" | "yaml";
}

function newTab(overrides?: Partial<Tab>): Tab {
  return {
    id: crypto.randomUUID(),
    title: "Unbenannt",
    content: "",
    filePath: null,
    language: "plaintext",
    ...overrides,
  };
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([newTab()]);
  const [activeId, setActiveId] = useState<string>(tabs[0].id);
  const [error, setError] = useState<string | null>(null);
  const [autoFormatOnPaste, setAutoFormatOnPaste] = useState(false);
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [diffMode, setDiffMode] = useState(false);
  const [diffOriginalContent, setDiffOriginalContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const SIDEBAR_WIDTH_KEY = "klartext-sidebar-width";
  const MIN_SIDEBAR = 150;
  const MAX_SIDEBAR = 500;
  const defaultSidebarWidth = (() => {
    try {
      const w = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY) ?? "240", 10);
      if (Number.isFinite(w)) return Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, w));
    } catch {}
    return 240;
  })();
  const [sidebarWidth, setSidebarWidth] = useState(defaultSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const editorApiRef = useRef<EditorApi | null>(null);
  const sidebarWidthDuringDrag = useRef(sidebarWidth);

  usePersistedTabs(tabs, activeId, setTabs, setActiveId);

  useEffect(() => {
    if (tabs.length === 0) {
      const tab = newTab();
      setTabs([tab]);
      setActiveId(tab.id);
    }
  }, [tabs.length, setTabs, setActiveId]);

  const handleFilesDropped = useCallback(
    (tabs: { title: string; content: string; filePath: string | null; language: Tab["language"] }[]) => {
      const newTabs = tabs.map((t) => newTab(t));
      setTabs((prev) => [...prev, ...newTabs]);
      if (newTabs.length) setActiveId(newTabs[newTabs.length - 1].id);
      setError(null);
    },
    []
  );
  useDragDrop(isTauriEnv(), handleFilesDropped);

  const safeTabs = tabs.length > 0 ? tabs : [newTab()];
  const activeTab = safeTabs.find((t) => t.id === activeId) ?? safeTabs[0];
  const setActiveContent = useCallback(
    (content: string) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, content } : t))
      );
    },
    [activeId]
  );
  const setActiveLanguage = useCallback(
    (language: Tab["language"]) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeId ? { ...t, language } : t))
      );
    },
    [activeId]
  );

  const addTab = useCallback(() => {
    const tab = newTab();
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
    setError(null);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) return [newTab()];
      if (activeId === id) {
        const idx = prev.findIndex((t) => t.id === id);
        const newActive = next[Math.max(0, idx - 1)];
        setActiveId(newActive.id);
      }
      return next;
    });
    setError(null);
  }, [activeId]);

  const handleOpen = useCallback(async () => {
    const result = await openFile();
    if (!result) return;
    setError(null);
    const ext = result.path.split(".").pop()?.toLowerCase();
    const language: Tab["language"] =
      ext === "json"
        ? "json"
        : ext === "xml" || ext === "xsl"
          ? "xml"
          : ext === "yaml" || ext === "yml"
            ? "yaml"
            : "plaintext";
    const tab: Tab = {
      ...newTab(),
      title: getFileName(result.path),
      content: result.content,
      filePath: result.path,
      language,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }, []);

  const handleSave = useCallback(async () => {
    const content = editorApiRef.current?.getValue() ?? activeTab.content;
    const path = await saveFile(activeTab.filePath, content);
    if (path == null) return;
    setError(null);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, filePath: path, title: getFileName(path), content }
          : t
      )
    );
  }, [activeId, activeTab.filePath, activeTab.content]);

  const runFormat = useCallback(
    (fn: (content: string) => string) => {
      setError(null);
      const content = editorApiRef.current?.getValue() ?? activeTab.content;
      try {
        const formatted = fn(content);
        editorApiRef.current?.setValue(formatted);
        setActiveContent(formatted);
      } catch {
        setError("Das Zielformat wurde nicht erkannt.");
      }
    },
    [activeTab.content, setActiveContent]
  );

  const handleFormatJson = useCallback(() => {
    runFormat((c) => formatJson(c));
    setActiveLanguage("json");
  }, [runFormat, setActiveLanguage]);
  const handleFormatXml = useCallback(() => {
    runFormat((c) => formatXml(c));
    setActiveLanguage("xml");
  }, [runFormat, setActiveLanguage]);
  const handleFormatYaml = useCallback(() => {
    runFormat((c) => formatYaml(c));
    setActiveLanguage("yaml");
  }, [runFormat, setActiveLanguage]);
  const handleMinify = useCallback(() => {
    setError(null);
    const content = editorApiRef.current?.getValue() ?? activeTab.content;
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const minified = minifyJson(content);
        editorApiRef.current?.setValue(minified);
        setActiveContent(minified);
        setActiveLanguage("json");
      } else if (trimmed.startsWith("<")) {
        const minified = minifyXml(content);
        editorApiRef.current?.setValue(minified);
        setActiveContent(minified);
        setActiveLanguage("xml");
      } else {
        try {
          const minified = minifyYaml(content);
          editorApiRef.current?.setValue(minified);
          setActiveContent(minified);
          setActiveLanguage("yaml");
        } catch {
          setError("Das Zielformat wurde nicht erkannt.");
        }
      }
    } catch {
      setError("Das Zielformat wurde nicht erkannt.");
    }
  }, [activeTab.content, setActiveContent, setActiveLanguage]);
  const handleClear = useCallback(() => {
    setActiveContent("");
    setError(null);
    setActiveLanguage("plaintext");
  }, [setActiveContent, setActiveLanguage]);

  const handlePasteFormatted = useCallback(
    (formatted: string, language: "json" | "xml" | "yaml") => {
      setActiveContent(formatted);
      setActiveLanguage(language);
    },
    [setActiveContent, setActiveLanguage]
  );

  const handleCheckForUpdates = useCallback(async () => {
    if (!isTauriEnv()) return;
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const { ask } = await import("@tauri-apps/plugin-dialog");
      const update = await check();
      if (!update) {
        await ask("Keine Updates verfügbar. Du hast bereits die neueste Version.", {
          title: "Update",
          okLabel: "OK",
        });
        return;
      }
      const install = await ask(
        `Version ${update.version} ist verfügbar.${update.body ? `\n\n${update.body}` : ""}\n\nJetzt herunterladen und installieren?`,
        { title: "Update verfügbar", okLabel: "Jetzt installieren", cancelLabel: "Später" }
      );
      if (!install) return;
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await update.downloadAndInstall();
      await relaunch();
    } catch (e) {
      const { message: showMessage } = await import("@tauri-apps/plugin-dialog");
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("Update check failed:", e);
      const is404 = errorMsg.includes("404") || errorMsg.includes("not found");
      const hint = is404
        ? "Die Update-Datei (latest.json) existiert noch nicht.\n\nDas ist normal, wenn noch kein Release mit Signing gebaut wurde.\n\nBitte:\n1. GitHub Secret TAURI_SIGNING_PRIVATE_KEY setzen\n2. Neues Release bauen (Tag-Push)"
        : "Für Updates muss ein Release mit Signing gebaut worden sein.";
      await showMessage(`Update-Prüfung fehlgeschlagen:\n\n${errorMsg}\n\n${hint}`, {
        title: "Update-Fehler",
        kind: "error",
      });
      setError(errorMsg);
    }
  }, []);

  const handleCompare = useCallback(() => {
    setDiffOriginalContent(activeTab.content);
    setDiffMode(true);
  }, [activeTab.content]);

  const handleCloseDiff = useCallback(() => setDiffMode(false), []);

  const lineCount = activeTab.content ? activeTab.content.split(/\r?\n/).length : 1;
  const formatLabel =
    activeTab.language === "json"
      ? "JSON"
      : activeTab.language === "xml"
        ? "XML"
        : activeTab.language === "yaml"
          ? "YAML"
          : "Plain Text";

  let outline: ReturnType<typeof getDocumentOutline> = null;
  let breadcrumbPath: ReturnType<typeof getPathAtLine> = null;
  try {
    outline = getDocumentOutline(
      editorApiRef.current?.getValue() ?? activeTab.content,
      activeTab.language
    );
    breadcrumbPath = outline?.root ? getPathAtLine(outline.root, cursor.line) : null;
  } catch {
    outline = null;
    breadcrumbPath = null;
  }

  const handleOutlineSelectLine = useCallback((line: number) => {
    editorApiRef.current?.revealLine(line);
  }, []);

  const handleResizerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!sidebarOpen) return;
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;
      sidebarWidthDuringDrag.current = startWidth;

      const onMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        let next = startWidth + delta;
        next = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, next));
        setSidebarWidth(next);
        sidebarWidthDuringDrag.current = next;
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        try {
          localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidthDuringDrag.current));
        } catch {}
        editorApiRef.current?.layout();
        setIsResizing(false);
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      setIsResizing(true);
    },
    [sidebarOpen, sidebarWidth]
  );

  return (
    <div className="app-layout">
      <TitleBar />
      <div className="toolbar">
        <button type="button" className="toolbar-btn ghost" onClick={handleOpen} title="Öffnen">
          <FolderOpen size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={handleSave} title="Speichern">
          <Save size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={addTab} title="Neuer Tab">
          <FilePlus size={18} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ghost ${sidebarOpen ? "active" : ""}`}
          onClick={() => setSidebarOpen((v) => !v)}
          title="Struktur-Sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <div className="toolbar-sep" />
        <button type="button" className="toolbar-btn ghost" onClick={handleFormatJson} title="JSON formatieren">
          <Braces size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={handleFormatXml} title="XML formatieren">
          <CodeXml size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={handleFormatYaml} title="YAML formatieren">
          <FileCode size={18} />
        </button>
        <div className="toolbar-sep" />
        <button type="button" className="toolbar-btn ghost" onClick={handleMinify} title="Minify">
          <Minus size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={handleClear} title="Clear">
          <Trash2 size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={handleCompare} title="Vergleichen">
          <GitCompare size={18} />
        </button>
        {isTauriEnv() && (
          <button type="button" className="toolbar-btn ghost" onClick={handleCheckForUpdates} title="Nach Updates suchen">
            <Download size={18} />
          </button>
        )}
        <div className="toolbar-sep" />
        <label className="toolbar-checkbox">
          <input
            type="checkbox"
            checked={autoFormatOnPaste}
            onChange={(e) => setAutoFormatOnPaste(e.target.checked)}
          />
          <span>Auto-Format</span>
        </label>
        {error && (
          <>
            <div className="toolbar-sep" />
            <span className="toolbar-error">{error}</span>
          </>
        )}
      </div>
      <div className="tab-bar">
        {safeTabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeId ? "tab-active" : ""}`}
            onClick={() => setActiveId(tab.id)}
          >
            <span className="tab-title">{tab.title}</span>
            <button
              type="button"
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              aria-label="Tab schließen"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {!diffMode && (
        <div className="breadcrumbs-bar">
          <Breadcrumbs path={breadcrumbPath} />
        </div>
      )}
      {diffMode ? (
        <DiffEditorView
          original={diffOriginalContent}
          modified={activeTab.content}
          language={activeTab.language}
          onClose={handleCloseDiff}
        />
      ) : (
        <div className="main-content" ref={mainContentRef}>
          {sidebarOpen && (
            <>
              <aside
                className="sidebar"
                style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
              >
                <DocumentOutline
                  root={outline?.root ?? null}
                  onSelectLine={handleOutlineSelectLine}
                />
              </aside>
              <div
                className={`sidebar-resizer ${isResizing ? "active" : ""}`}
                onMouseDown={handleResizerMouseDown}
                role="separator"
                aria-label="Sidebar-Breite ändern"
              />
            </>
          )}
          <Editor
            value={activeTab.content}
            onChange={setActiveContent}
            language={activeTab.language}
            autoFormatOnPaste={autoFormatOnPaste}
            onPasteFormatted={handlePasteFormatted}
            onCursorChange={(line, column) => setCursor({ line, column })}
            onEditorReady={(api) => { editorApiRef.current = api; }}
            onEditorUnmount={() => { editorApiRef.current = null; }}
          />
        </div>
      )}
      <StatusBar
        lineCount={lineCount}
        format={formatLabel}
        cursorLine={cursor.line}
        cursorColumn={cursor.column}
      />
    </div>
  );
}
