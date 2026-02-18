import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import * as monaco from "monaco-editor";

const MIDNIGHT_DIFF = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "key", foreground: "7eb8da" },
    { token: "string.key.json", foreground: "7eb8da" },
    { token: "tag", foreground: "8fbc8f" },
    { token: "tag.xml", foreground: "8fbc8f" },
  ],
  colors: {
    "editor.background": "#0f111a",
    "editor.foreground": "#e6e6e6",
    "diffEditor.insertedTextBackground": "#1e3a2a",
    "diffEditor.insertedLineBackground": "#1e3a2a44",
    "diffEditor.removedTextBackground": "#3a1e1e",
    "diffEditor.removedLineBackground": "#3a1e1e44",
  },
};

interface DiffEditorViewProps {
  original: string;
  modified: string;
  language: string;
  onClose: () => void;
}

export function DiffEditorView({ original, modified, language, onClose }: DiffEditorViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    monaco.editor.defineTheme("midnight-diff", MIDNIGHT_DIFF);
    monaco.editor.setTheme("midnight-diff");

    const originalModel = monaco.editor.createModel(original, language);
    const modifiedModel = monaco.editor.createModel(modified, language);

    const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
      readOnly: true,
      renderSideBySide: true,
      enableSplitViewResizing: true,
      fontSize: 14,
      fontFamily: "Cascadia Code, Fira Code, Consolas, monospace",
      automaticLayout: true,
      diffWordWrap: "on",
      renderIndicators: true,
      stickyScroll: { enabled: false },
    });
    diffEditor.setModel({ original: originalModel, modified: modifiedModel });
    diffEditorRef.current = diffEditor;

    return () => {
      originalModel.dispose();
      modifiedModel.dispose();
      diffEditor.dispose();
      diffEditorRef.current = null;
    };
  }, [original, modified, language]);

  return (
    <div className="editor-wrap diff-wrap">
      <div className="diff-toolbar">
        <span className="diff-label">Vergleichsmodus</span>
        <button type="button" className="toolbar-btn ghost" onClick={onClose} title="Vergleich schließen">
          <X size={18} />
        </button>
      </div>
      <div ref={containerRef} className="diff-editor-container" />
    </div>
  );
}
