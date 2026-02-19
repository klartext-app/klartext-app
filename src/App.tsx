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
  Settings,
  Search,
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
  jsonToYaml,
  yamlToJson,
  jsonToXml,
  xmlToJson,
} from "./formatters";

export interface Tab {
  id: string;
  title: string;
  content: string;
  filePath: string | null;
  language: "plaintext" | "json" | "xml" | "yaml";
  dirty: boolean;
}

type UiLanguage = "de" | "en";
type FormatId = "json" | "xml" | "yaml";

function newTab(overrides?: Partial<Tab>): Tab {
  return {
    id: crypto.randomUUID(),
    title: "Unbenannt",
    content: "",
    filePath: null,
    language: "plaintext",
    dirty: false,
    ...overrides,
  };
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([newTab()]);
  const [activeId, setActiveId] = useState<string>(tabs[0].id);
  const [error, setError] = useState<string | null>(null);
  const [autoFormatOnPaste, setAutoFormatOnPaste] = useState(false);
  const [diffMode, setDiffMode] = useState(false);
  const [diffOriginalContent, setDiffOriginalContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<number | null>(null);
  const LANGUAGE_KEY = "klartext-language";
  const FONT_SIZE_KEY = "klartext-font-size";
  const MIN_FONT_SIZE = 10;
  const MAX_FONT_SIZE = 28;
  const defaultFontSize = (() => {
    try {
      const v = parseInt(localStorage.getItem(FONT_SIZE_KEY) ?? "14", 10);
      if (Number.isFinite(v)) return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, v));
    } catch {}
    return 14;
  })();
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const defaultLanguage: UiLanguage = (() => {
    try {
      const v = localStorage.getItem(LANGUAGE_KEY);
      if (v === "en" || v === "de") return v;
    } catch {}
    return "de";
  })();
  const [language, setLanguage] = useState<UiLanguage>(defaultLanguage);

  const DEFAULT_FAVORITES: Record<FormatId, boolean> = {
    json: true,
    xml: true,
    yaml: false,
  };
  const FAVORITES_KEY = "klartext-favorites";
  const defaultFavorites: Record<FormatId, boolean> = (() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<FormatId, boolean>>;
        return {
          json: parsed.json ?? true,
          xml: parsed.xml ?? true,
          yaml: parsed.yaml ?? true,
        };
      }
    } catch {}
    return DEFAULT_FAVORITES;
  })();
  const [favorites, setFavorites] = useState<Record<FormatId, boolean>>(defaultFavorites);
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
  const AUTO_SAVE_KEY = "klartext-auto-save";
  const defaultAutoSave = (() => {
    try {
      const v = localStorage.getItem(AUTO_SAVE_KEY);
      return v === "true";
    } catch {}
    return false;
  })();
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(defaultAutoSave);

  usePersistedTabs(tabs, activeId, setTabs, setActiveId);

  const labels = language === "de"
    ? {
        open: "Öffnen",
        save: "Speichern",
        newTab: "Neuer Tab",
        sidebar: "Struktur-Sidebar",
        formatJson: "JSON formatieren",
        formatXml: "XML formatieren",
        formatYaml: "YAML formatieren",
        minify: "Minify",
        clear: "Leeren",
        compare: "Vergleichen",
        updates: "Nach Updates suchen",
        autoFormat: "Auto-Format",
        fontSmaller: "Schriftgröße verkleinern",
        fontLarger: "Schriftgröße vergrößern",
        convertJsonToYaml: "JSON → YAML",
        convertYamlToJson: "YAML → JSON",
        convertJsonToXml: "JSON → XML",
        convertXmlToJson: "XML → JSON",
        search: "Suche",
        replace: "Ersetzen",
        undo: "Rückgängig (Strg+Z)",
        redo: "Wiederholen (Strg+Y)",
        autoSaveLabel: "Auto-Speichern",
        settings: "Einstellungen",
        settingsTitle: "Einstellungen",
        languageLabel: "Sprache",
        languageDe: "Deutsch",
        languageEn: "Englisch",
        favoritesLabel: "Favorisierte Formate",
        favoriteJson: "JSON",
        favoriteXml: "XML",
        favoriteYaml: "YAML",
        closeSettings: "Schließen",
      }
    : {
        open: "Open",
        save: "Save",
        newTab: "New tab",
        sidebar: "Structure sidebar",
        formatJson: "Format JSON",
        formatXml: "Format XML",
        formatYaml: "Format YAML",
        minify: "Minify",
        clear: "Clear",
        compare: "Compare",
        updates: "Check for updates",
        autoFormat: "Auto-format",
        fontSmaller: "Decrease font size",
        fontLarger: "Increase font size",
        convertJsonToYaml: "JSON → YAML",
        convertYamlToJson: "YAML → JSON",
        convertJsonToXml: "JSON → XML",
        convertXmlToJson: "XML → JSON",
        search: "Search",
        replace: "Replace",
        undo: "Undo (Ctrl+Z)",
        redo: "Redo (Ctrl+Y)",
        autoSaveLabel: "Auto-save",
        settings: "Settings",
        settingsTitle: "Settings",
        languageLabel: "Language",
        languageDe: "German",
        languageEn: "English",
        favoritesLabel: "Favorite formats",
        favoriteJson: "JSON",
        favoriteXml: "XML",
        favoriteYaml: "YAML",
        closeSettings: "Close",
      };

  const updateFontSize = useCallback(
    (updater: (current: number) => number) => {
      setFontSize((current) => {
        const next = updater(current);
        try {
          localStorage.setItem(FONT_SIZE_KEY, String(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const increaseFontSize = useCallback(() => {
    updateFontSize((current) => Math.min(MAX_FONT_SIZE, current + 1));
  }, [updateFontSize]);

  const decreaseFontSize = useCallback(() => {
    updateFontSize((current) => Math.max(MIN_FONT_SIZE, current - 1));
  }, [updateFontSize]);

  const handleChangeLanguage = useCallback((lang: UiLanguage) => {
    setLanguage(lang);
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {}
  }, []);

  const toggleFavorite = useCallback((id: FormatId) => {
    setFavorites((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleToggleAutoSave = useCallback(() => {
    setAutoSaveEnabled((current) => {
      const next = !current;
      try {
        localStorage.setItem(AUTO_SAVE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const findNextMatch = useCallback(
    (direction: "next" | "prev") => {
      const current = tabs.find((t) => t.id === activeId) ?? tabs[0];
      if (!current) return;
      const text = current.content;
      const query = searchQuery;
      if (!query) return;
      const from = searchIndex ?? 0;
      let idx: number;
      if (direction === "next") {
        idx = text.indexOf(query, from + (searchIndex != null ? 1 : 0));
        if (idx === -1) idx = text.indexOf(query);
      } else {
        idx = text.lastIndexOf(query, from - 1);
        if (idx === -1) idx = text.lastIndexOf(query);
      }
      if (idx === -1) return;
      setSearchIndex(idx);
      const before = text.slice(0, idx);
      const line = before.split(/\r?\n/).length;
      editorApiRef.current?.revealLine(line);
    },
    [tabs, activeId, searchIndex, searchQuery]
  );

  const handleSearchSubmit = useCallback(() => {
    setSearchIndex(null);
    findNextMatch("next");
  }, [findNextMatch]);

  const handleReplaceAll = useCallback(() => {
    if (!searchQuery) return;
    const current = tabs.find((t) => t.id === activeId) ?? tabs[0];
    if (!current) return;
    const text = current.content;
    if (!text.includes(searchQuery)) return;
    const updated = text.split(searchQuery).join(replaceQuery);
    editorApiRef.current?.setValue(updated);
    setTabs((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, content: updated } : t))
    );
  }, [tabs, activeId, searchQuery, replaceQuery]);

  useEffect(() => {
    if (tabs.length === 0) {
      const tab = newTab();
      setTabs([tab]);
      setActiveId(tab.id);
    }
  }, [tabs.length]);

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
        prev.map((t) =>
          t.id === activeId ? { ...t, content, dirty: true } : t
        )
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
      dirty: false,
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
          ? { ...t, filePath: path, title: getFileName(path), content, dirty: false }
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
        setTabs((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, content: formatted } : t))
        );
      } catch {
        setError(language === "de" ? "Das Zielformat wurde nicht erkannt." : "Target format not recognized.");
      }
    },
    [activeId, activeTab.content, language]
  );

  const handleFormatJson = useCallback(() => {
    const current = tabs.find((t) => t.id === activeId) ?? tabs[0];
    if (!current) return;
    const content = editorApiRef.current?.getValue() ?? current.content;
    try {
      let next = content;
      if (current.language === "yaml") {
        next = yamlToJson(content);
      } else if (current.language === "xml") {
        next = xmlToJson(content);
      } else {
        next = formatJson(content);
      }
      editorApiRef.current?.setValue(next);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, content: next, language: "json", dirty: true } : t
        )
      );
    } catch {
      setError(language === "de" ? "Das Zielformat wurde nicht erkannt." : "Target format not recognized.");
    }
  }, [tabs, activeId, language]);

  const handleFormatXml = useCallback(() => {
    const current = tabs.find((t) => t.id === activeId) ?? tabs[0];
    if (!current) return;
    const content = editorApiRef.current?.getValue() ?? current.content;
    try {
      let next = content;
      if (current.language === "json") {
        next = jsonToXml(content);
      } else {
        next = formatXml(content);
      }
      editorApiRef.current?.setValue(next);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, content: next, language: "xml", dirty: true } : t
        )
      );
    } catch {
      setError(language === "de" ? "Das Zielformat wurde nicht erkannt." : "Target format not recognized.");
    }
  }, [tabs, activeId, language]);

  const handleFormatYaml = useCallback(() => {
    const current = tabs.find((t) => t.id === activeId) ?? tabs[0];
    if (!current) return;
    const content = editorApiRef.current?.getValue() ?? current.content;
    try {
      let next = content;
      if (current.language === "json") {
        next = jsonToYaml(content);
      } else {
        next = formatYaml(content);
      }
      editorApiRef.current?.setValue(next);
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, content: next, language: "yaml", dirty: true } : t
        )
      );
    } catch {
      setError(language === "de" ? "Das Zielformat wurde nicht erkannt." : "Target format not recognized.");
    }
  }, [tabs, activeId, language]);

  const handleMinify = useCallback(() => {
    setError(null);
    const content = editorApiRef.current?.getValue() ?? activeTab.content;
    const trimmed = content.trim();
    if (!trimmed) return;
    const errorMsg = language === "de" ? "Das Zielformat wurde nicht erkannt." : "Target format not recognized.";
    try {
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const minified = minifyJson(content);
        editorApiRef.current?.setValue(minified);
        setTabs((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, content: minified } : t))
        );
        setActiveLanguage("json");
      } else if (trimmed.startsWith("<")) {
        const minified = minifyXml(content);
        editorApiRef.current?.setValue(minified);
        setTabs((prev) =>
          prev.map((t) => (t.id === activeId ? { ...t, content: minified } : t))
        );
        setActiveLanguage("xml");
      } else {
        try {
          const minified = minifyYaml(content);
          editorApiRef.current?.setValue(minified);
          setTabs((prev) =>
            prev.map((t) => (t.id === activeId ? { ...t, content: minified } : t))
          );
          setActiveLanguage("yaml");
        } catch {
          setError(errorMsg);
        }
      }
    } catch {
      setError(errorMsg);
    }
  }, [activeTab.content, activeId, language]);
  const handleClear = useCallback(() => {
    setActiveContent("");
    setError(null);
    setActiveLanguage("plaintext");
  }, [setActiveContent, setActiveLanguage]);

  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (!activeTab.filePath || !activeTab.dirty) return;
    const timer = setTimeout(async () => {
      const content = editorApiRef.current?.getValue() ?? activeTab.content;
      const path = await saveFile(activeTab.filePath, content);
      if (path == null) return;
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? { ...t, filePath: path, title: getFileName(path), content, dirty: false }
            : t
        )
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [autoSaveEnabled, activeId, activeTab.filePath, activeTab.content, activeTab.dirty]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [error]);

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

  const formatButtons: { id: FormatId; onClick: () => void; icon: JSX.Element; title: string }[] = [
    {
      id: "json",
      onClick: handleFormatJson,
      icon: <Braces size={18} />,
      title: labels.formatJson,
    },
    {
      id: "xml",
      onClick: handleFormatXml,
      icon: <CodeXml size={18} />,
      title: labels.formatXml,
    },
    {
      id: "yaml",
      onClick: handleFormatYaml,
      icon: <FileCode size={18} />,
      title: labels.formatYaml,
    },
  ];
  const activeFormatButtons =
    Object.values(favorites).some(Boolean)
      ? formatButtons.filter((b) => favorites[b.id])
      : formatButtons;

  let outline: ReturnType<typeof getDocumentOutline> = null;
  let breadcrumbPath: ReturnType<typeof getPathAtLine> = null;
  try {
    outline = getDocumentOutline(
      editorApiRef.current?.getValue() ?? activeTab.content,
      activeTab.language
    );
    breadcrumbPath = outline?.root ? getPathAtLine(outline.root, 1) : null;
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
        <button type="button" className="toolbar-btn ghost" onClick={handleOpen} title={labels.open}>
          <FolderOpen size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={handleSave} title={labels.save}>
          <Save size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={addTab} title={labels.newTab}>
          <FilePlus size={18} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ghost ${sidebarOpen ? "active" : ""}`}
          onClick={() => setSidebarOpen((v) => !v)}
          title={labels.sidebar}
        >
          <PanelLeft size={18} />
        </button>
        <div className="toolbar-sep" />
        {activeFormatButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            className="toolbar-btn ghost"
            onClick={btn.onClick}
            title={btn.title}
          >
            {btn.icon}
          </button>
        ))}
        <div className="toolbar-sep" />
        <button type="button" className="toolbar-btn ghost" onClick={handleMinify} title={labels.minify}>
          <Minus size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={handleClear} title={labels.clear}>
          <Trash2 size={18} />
        </button>
        <button type="button" className="toolbar-btn ghost" onClick={handleCompare} title={labels.compare}>
          <GitCompare size={18} />
        </button>
        {isTauriEnv() && (
          <button
            type="button"
            className="toolbar-btn ghost"
            onClick={handleCheckForUpdates}
            title={labels.updates}
          >
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
          <span>{labels.autoFormat}</span>
        </label>
        <div className="toolbar-sep" />
        <div className="toolbar-fontsize">
          <button
            type="button"
            className="toolbar-btn ghost"
            onClick={decreaseFontSize}
            title={labels.fontSmaller}
          >
            A-
          </button>
          <span className="toolbar-fontsize-label">{fontSize}px</span>
          <button
            type="button"
            className="toolbar-btn ghost"
            onClick={increaseFontSize}
            title={labels.fontLarger}
          >
            A+
          </button>
        </div>
        <div className="toolbar-sep" />
        <button
          type="button"
          className="toolbar-btn ghost"
          onClick={() => setSettingsOpen(true)}
          title={labels.settings}
        >
          <Settings size={18} />
        </button>
        <button
          type="button"
          className={`toolbar-btn ghost ${searchOpen ? "active" : ""}`}
          onClick={() => setSearchOpen((v) => !v)}
          title={labels.search}
        >
          <Search size={18} />
        </button>
      </div>
      <div className="tab-bar">
        {safeTabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeId ? "tab-active" : ""}`}
            onClick={() => setActiveId(tab.id)}
          >
            <span className="tab-title">
              {tab.dirty ? "• " : ""}
              {tab.title}
            </span>
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
        <>
          <div className="breadcrumbs-bar">
            <Breadcrumbs path={breadcrumbPath} />
          </div>
          {searchOpen && (
            <div className="search-bar">
              <input
                className="search-input"
                placeholder={labels.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchSubmit();
                }}
              />
              <input
                className="search-input"
                placeholder={labels.replace}
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
              />
              <button
                type="button"
                className="toolbar-btn ghost"
                onClick={handleSearchSubmit}
                title={labels.search}
              >
                {labels.search}
              </button>
              <button
                type="button"
                className="toolbar-btn ghost"
                onClick={() => findNextMatch("next")}
                title={labels.search}
              >
                ↑
              </button>
              <button
                type="button"
                className="toolbar-btn ghost"
                onClick={() => findNextMatch("prev")}
                title={labels.search}
              >
                ↓
              </button>
              <button
                type="button"
                className="toolbar-btn ghost"
                onClick={handleReplaceAll}
                title={labels.replace}
              >
                {labels.replace}
              </button>
            </div>
          )}
        </>
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
            fontSize={fontSize}
            autoFormatOnPaste={autoFormatOnPaste}
            onPasteFormatted={handlePasteFormatted}
            onEditorReady={(api) => { editorApiRef.current = api; }}
            onEditorUnmount={() => { editorApiRef.current = null; }}
          />
        </div>
      )}
      <StatusBar
        lineCount={lineCount}
        format={formatLabel}
        language={language}
        error={error}
      />
      {settingsOpen && (
        <div className="settings-backdrop" onClick={() => setSettingsOpen(false)}>
          <div
            className="settings-panel"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="settings-header">
              <span className="settings-title">{labels.settingsTitle}</span>
            </div>
            <div className="settings-section">
              <div className="settings-section-title">{labels.languageLabel}</div>
              <div className="settings-row">
                <label className="settings-radio">
                  <input
                    type="radio"
                    name="language"
                    value="de"
                    checked={language === "de"}
                    onChange={() => handleChangeLanguage("de")}
                  />
                  <span>{labels.languageDe}</span>
                </label>
                <label className="settings-radio">
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={language === "en"}
                    onChange={() => handleChangeLanguage("en")}
                  />
                  <span>{labels.languageEn}</span>
                </label>
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-section-title">{labels.favoritesLabel}</div>
              <div className="settings-row">
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={favorites.json}
                    onChange={() => toggleFavorite("json")}
                  />
                  <span>{labels.favoriteJson}</span>
                </label>
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={favorites.xml}
                    onChange={() => toggleFavorite("xml")}
                  />
                  <span>{labels.favoriteXml}</span>
                </label>
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={favorites.yaml}
                    onChange={() => toggleFavorite("yaml")}
                  />
                  <span>{labels.favoriteYaml}</span>
                </label>
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-section-title">{language === "de" ? "Speichern" : "Save"}</div>
              <div className="settings-row">
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={handleToggleAutoSave}
                  />
                  <span>{labels.autoSaveLabel}</span>
                </label>
              </div>
            </div>
            <div className="settings-actions">
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setSettingsOpen(false)}
              >
                {labels.closeSettings}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
