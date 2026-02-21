import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, foldGutter, indentOnInput, bracketMatching } from "@codemirror/language";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { search, searchKeymap, SearchQuery, setSearchQuery, findNext, findPrevious, replaceAll } from "@codemirror/search";
import { tags } from "@lezer/highlight";
import { HighlightStyle } from "@codemirror/language";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

// Compartments for dynamic reconfiguration
const languageCompartment = new Compartment();
const fontSizeCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

// Midnight highlight style
const midnightHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#c792ea" },
  { tag: tags.string, color: "#c3e88d" },
  { tag: tags.number, color: "#f78c6c" },
  { tag: tags.bool, color: "#ff5572" },
  { tag: tags.null, color: "#ff5572" },
  { tag: tags.propertyName, color: "#7eb8da" },
  { tag: tags.tagName, color: "#8fbc8f" },
  { tag: tags.attributeName, color: "#9cdcfe" },
  { tag: tags.comment, color: "#546e7a", fontStyle: "italic" },
  { tag: tags.punctuation, color: "#808080" },
  { tag: tags.operator, color: "#89ddff" },
  { tag: tags.content, color: "#e6e6e6" },
]);

function getLanguageExtension(lang) {
  switch (lang) {
    case "json": return json();
    case "xml": return xml();
    case "yaml": return yaml();
    default: return [];
  }
}

// Create editor
let view = null;
let currentFontSize = 14;
let onChangeCallback = null;

function fontSizeTheme(size) {
  return EditorView.theme({
    ".cm-content": { fontSize: `${size}px` },
    ".cm-gutters": { fontSize: `${size}px` },
    ".cm-scroller": { fontFamily: '"Cascadia Code", "Fira Code", "Menlo", "Monaco", monospace' },
  });
}

function createEditor(initialContent, language, fontSize) {
  currentFontSize = fontSize || 14;

  const container = document.getElementById("editor");

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const content = update.state.doc.toString();
      if (onChangeCallback) onChangeCallback(content);
      // Swift Bridge
      if (window.webkit?.messageHandlers?.contentChanged) {
        window.webkit.messageHandlers.contentChanged.postMessage(content);
      }
    }
  });

  const state = EditorState.create({
    doc: initialContent || "",
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      foldGutter(),
      drawSelection(),
      indentOnInput(),
      bracketMatching(),
      syntaxHighlighting(midnightHighlight),
      languageCompartment.of(getLanguageExtension(language || "plaintext")),
      fontSizeCompartment.of(fontSizeTheme(currentFontSize)),
      readOnlyCompartment.of(EditorState.readOnly.of(false)),
      search({ top: false }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        indentWithTab,
      ]),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { backgroundColor: "#0f111a", height: "100%" },
        ".cm-content": { caretColor: "#7eb8da", padding: "12px 0", color: "#e6e6e6" },
        ".cm-focused .cm-cursor": { borderLeftColor: "#7eb8da" },
        ".cm-focused .cm-selectionBackground, .cm-selectionBackground": {
          background: "#1e3a5f"
        },
        ".cm-panels": { backgroundColor: "#0f111a", borderTop: "1px solid #1e2030" },
        ".cm-search": { backgroundColor: "#0d0f18" },
        ".cm-button": {
          backgroundColor: "#1e2030",
          color: "#e6e6e6",
          borderRadius: "4px",
          border: "1px solid #2e3347",
        },
        ".cm-textfield": {
          backgroundColor: "#141720",
          color: "#e6e6e6",
          border: "1px solid #2e3347",
          borderRadius: "4px",
        },
      }, { dark: true }),
      EditorView.theme({ "&": { className: "midnight" } }),
      updateListener,
    ],
  });

  view = new EditorView({ state, parent: container });
  container.classList.add("midnight");
}

// Public API exposed to Swift via WKWebView
window.KlartextEditorAPI = {
  init(content, language, fontSize) {
    createEditor(content, language, fontSize);
  },

  getValue() {
    return view ? view.state.doc.toString() : "";
  },

  setValue(content) {
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  },

  setLanguage(lang) {
    if (!view) return;
    const currentContent = view.state.doc.toString();
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: currentContent },
      effects: languageCompartment.reconfigure(getLanguageExtension(lang)),
    });
  },

  setContentAndLanguage(content, lang) {
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
      effects: languageCompartment.reconfigure(getLanguageExtension(lang)),
    });
  },

  setFontSize(size) {
    if (!view) return;
    currentFontSize = size;
    view.dispatch({
      effects: fontSizeCompartment.reconfigure(fontSizeTheme(size)),
    });
  },

  setReadOnly(readonly) {
    if (!view) return;
    view.dispatch({
      effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(readonly)),
    });
  },

  revealLine(line) {
    if (!view) return;
    const lineObj = view.state.doc.line(Math.min(line, view.state.doc.lines));
    view.dispatch({ selection: { anchor: lineObj.from }, scrollIntoView: true });
    view.focus();
  },

  search(query) {
    if (!view) return;
    const sq = new SearchQuery({ search: query, caseSensitive: false });
    view.dispatch({ effects: setSearchQuery.of(sq) });
    findNext(view);
  },

  searchNext() { if (view) findNext(view); },
  searchPrev() { if (view) findPrevious(view); },

  replaceAll(search, replacement) {
    if (!view) return;
    const sq = new SearchQuery({ search, replace: replacement, caseSensitive: false });
    view.dispatch({ effects: setSearchQuery.of(sq) });
    replaceAll(view);
  },

  getLineCount() {
    return view ? view.state.doc.lines : 0;
  },

  focus() { if (view) view.focus(); },

  // YAML operations (no native Swift YAML library needed)
  yamlFormat(text) {
    try {
      const parsed = parseYaml(text);
      if (parsed === undefined) return { error: "Ungültiges YAML" };
      return { result: stringifyYaml(parsed, { indent: 2 }) };
    } catch (e) {
      return { error: e.message };
    }
  },

  yamlMinify(text) {
    try {
      const parsed = parseYaml(text);
      if (parsed === undefined) return { error: "Ungültiges YAML" };
      return { result: stringifyYaml(parsed, { lineWidth: 0 }) };
    } catch (e) {
      return { error: e.message };
    }
  },

  jsonToYaml(text) {
    try {
      const parsed = JSON.parse(text);
      return { result: stringifyYaml(parsed, { indent: 2 }) };
    } catch (e) {
      return { error: e.message };
    }
  },

  yamlToJson(text) {
    try {
      const parsed = parseYaml(text);
      if (parsed === undefined) return { error: "Ungültiges YAML" };
      return { result: JSON.stringify(parsed, null, 2) };
    } catch (e) {
      return { error: e.message };
    }
  },

  onChange(callback) {
    onChangeCallback = callback;
  },
};
