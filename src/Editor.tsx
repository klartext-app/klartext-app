import { useRef, useEffect } from "react";
import EditorComponent from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { tryFormatPasted } from "./formatters";

const MIDNIGHT_THEME = {
  base: "vs-dark" as const,
  inherit: true,
  rules: [
    { token: "key", foreground: "7eb8da" },
    { token: "string.key.json", foreground: "7eb8da" },
    { token: "tag", foreground: "8fbc8f" },
    { token: "tag.xml", foreground: "8fbc8f" },
    { token: "attribute.name", foreground: "9cdcfe" },
    { token: "delimiter.xml", foreground: "808080" },
  ],
  colors: {
    "editor.background": "#0f111a",
    "editor.foreground": "#e6e6e6",
  },
};

export interface EditorApi {
  getValue: () => string;
  setValue: (value: string) => void;
  revealLine: (line: number) => void;
  layout: () => void;
}

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  autoFormatOnPaste?: boolean;
  onPasteFormatted?: (formatted: string, language: "json" | "xml" | "yaml") => void;
  onCursorChange?: (line: number, column: number) => void;
  /** Wird nach dem Mount aufgerufen – Formatierung setzt den Inhalt direkt im Editor. */
  onEditorReady?: (api: EditorApi) => void;
  /** Wird beim Unmount aufgerufen, damit die App die API nicht mehr nutzt. */
  onEditorUnmount?: () => void;
}

export function Editor({
  value,
  onChange,
  language = "plaintext",
  autoFormatOnPaste = false,
  onPasteFormatted,
  onCursorChange,
  onEditorReady,
  onEditorUnmount,
}: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const scrollbarStyleRef = useRef<HTMLStyleElement | null>(null);

  // Bei programmatischer Änderung (z. B. Format) Editor-Inhalt explizit setzen
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const current = editor.getValue();
    if (current !== value) editor.setValue(value);
  }, [value]);

  useEffect(() => () => {
    cleanupRef.current?.();
    onEditorUnmount?.();
  }, [onEditorUnmount]);

  const handleEditorDidMount = (monacoEditor: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    editorRef.current = monacoEditor;
    onEditorReady?.({
      getValue: () => monacoEditor.getValue(),
      setValue: (v) => monacoEditor.setValue(v),
      revealLine: (line) => {
        monacoEditor.revealLine(line, 1 /* center */);
        monacoEditor.setPosition({ lineNumber: line, column: 1 });
      },
      layout: () => monacoEditor.layout(),
    });
    monacoEditor.focus();

    // Scrollbar-Pfeile ausblenden: 1) Globaler Style (überschreibt Monacos CSS)
    if (!scrollbarStyleRef.current) {
      const style = document.createElement("style");
      style.setAttribute("data-klartext-scrollbar-hide", "true");
      style.textContent = `
        /* Nur die Pfeile ausblenden, nicht die Scrollbar selbst - mit höchster Spezifität */
        .monaco-editor .monaco-scrollable-element > .scrollbar > .scra,
        .monaco-editor .monaco-scrollable-element > .scrollbar > .arrow-background,
        .monaco-scrollable-element > .scrollbar.vertical > .scra,
        .monaco-scrollable-element > .scrollbar.vertical > .arrow-background,
        .monaco-scrollable-element > .scrollbar.horizontal > .scra,
        .monaco-scrollable-element > .scrollbar.horizontal > .arrow-background {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
      scrollbarStyleRef.current = style;
    }
    
    cleanupRef.current = () => {
      disposableCursor.dispose();
      if (domNode) domNode.removeEventListener("paste", pasteHandler);
    };

    // Midnight Theme
    monaco.editor.defineTheme("midnight", MIDNIGHT_THEME);
    monaco.editor.setTheme("midnight");

    // Cursor position
    const disposableCursor = monacoEditor.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position.lineNumber, e.position.column);
    });
    const pos = monacoEditor.getPosition();
    if (pos) onCursorChange?.(pos.lineNumber, pos.column);

    // Paste: intercept and optionally format
    const domNode = monacoEditor.getDomNode();
    const pasteHandler = (e: ClipboardEvent) => {
      if (!autoFormatOnPaste || !e.clipboardData) return;
      const pasted = e.clipboardData.getData("text/plain");
      const result = tryFormatPasted(pasted);
      if (!result) return;
      e.preventDefault();
      const selection = monacoEditor.getSelection();
      if (!selection) return;
      monacoEditor.executeEdits("paste", [
        { range: selection, text: result.formatted },
      ]);
      onChange(monacoEditor.getValue());
      onPasteFormatted?.(result.formatted, result.language);
    };
    if (domNode) domNode.addEventListener("paste", pasteHandler);

    cleanupRef.current = () => {
      disposableCursor.dispose();
      if (domNode) domNode.removeEventListener("paste", pasteHandler);
    };
  };

  return (
    <div className="editor-wrap">
      <EditorComponent
        height="100%"
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          folding: true,
          foldingStrategy: "indentation",
          showFoldingControls: "always",
          stickyScroll: { enabled: false },
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalHasArrows: false,
            horizontalHasArrows: false,
            arrowSize: 0,
          },
          fontSize: 14,
          fontFamily: "Cascadia Code, Fira Code, Consolas, monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 12 },
          renderLineHighlight: "all",
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
        }}
      />
    </div>
  );
}
