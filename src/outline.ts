/**
 * Document Outline: Strukturbaum für JSON/XML mit Zeilennummern.
 */

export interface OutlineNode {
  id: string;
  label: string;
  line: number;
  children: OutlineNode[];
  path: string[];
}

function nodeId(path: string[]): string {
  return path.join(".");
}

/** Sucht die Zeile eines JSON-Pfads, indem der letzte Key im Text gesucht wird. */
function findJsonPathLine(text: string, path: string[]): number {
  if (path.length === 0) return 1;
  const last = path[path.length - 1];
  if (/^\[\d+\]$/.test(last)) {
    const openBracket = text.indexOf("[");
    if (openBracket === -1) return 1;
    return text.slice(0, openBracket).split(/\r?\n/).length;
  }
  const escaped = `"${last.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  const keyPattern = new RegExp(escaped.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:", "g");
  const match = keyPattern.exec(text);
  if (!match) return 1;
  return text.slice(0, match.index).split(/\r?\n/).length;
}

function buildJsonNode(value: unknown, text: string, path: string[]): OutlineNode | null {
  if (value === null || typeof value !== "object") return null;

  const label = path[path.length - 1] ?? "root";
  const line = findJsonPathLine(text, path);
  const children: OutlineNode[] = [];

  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      const seg = `[${i}]`;
      const childPath = [...path, seg];
      const child = buildJsonNode(item, text, childPath);
      children.push(
        child ?? { id: nodeId(childPath), label: seg, line: findJsonPathLine(text, childPath), path: childPath, children: [] }
      );
    });
  } else {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const childPath = [...path, key];
      const child = buildJsonNode((value as Record<string, unknown>)[key], text, childPath);
      children.push(
        child ?? {
          id: nodeId(childPath),
          label: key,
          line: findJsonPathLine(text, childPath),
          path: childPath,
          children: [],
        }
      );
    }
  }

  return {
    id: nodeId(path),
    label,
    line,
    path,
    children,
  };
}

/** XML: Zeilen durch Suche nach öffnenden und schließenden Tags. */
function getXmlOutline(text: string): OutlineNode | null {
  const tags: { name: string; line: number; depth: number }[] = [];
  const stack: string[] = [];
  const tagRegex = /<\/?([a-zA-Z_][a-zA-Z0-9_.-]*)(?:\s|>|\/)/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(text)) !== null) {
    const tagName = m[1];
    const line = text.slice(0, m.index).split(/\r?\n/).length;
    const isClosing = m[0].startsWith("</");
    if (isClosing) {
      stack.pop();
      continue;
    }
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 20);
    if (after.startsWith("/>") || after.startsWith("/ >")) continue;
    const depth = stack.length;
    stack.push(tagName);
    tags.push({ name: tagName, line, depth });
  }
  if (tags.length === 0) return null;

  function build(parentDepth: number, startIdx: number, path: string[]): { node: OutlineNode; nextIdx: number } {
    const t = tags[startIdx];
    const childPath = [...path, t.name];
    const children: OutlineNode[] = [];
    let i = startIdx + 1;
    while (i < tags.length && tags[i].depth > parentDepth) {
      if (tags[i].depth === parentDepth + 1) {
        const res = build(tags[i].depth, i, childPath);
        children.push(res.node);
        i = res.nextIdx;
      } else i++;
    }
    return {
      node: { id: nodeId(childPath), label: t.name, line: t.line, path: childPath, children },
      nextIdx: i,
    };
  }

  const rootTag = tags[0];
  const path = [rootTag.name];
  const children: OutlineNode[] = [];
  let i = 1;
  while (i < tags.length && tags[i].depth > 0) {
    if (tags[i].depth === 1) {
      const res = build(1, i, path);
      children.push(res.node);
      i = res.nextIdx;
    } else i++;
  }
  return { id: nodeId(path), label: rootTag.name, line: rootTag.line, path, children };
}

export type OutlineResult = { root: OutlineNode } | null;

export function getDocumentOutline(
  content: string,
  language: "plaintext" | "json" | "xml" | "yaml"
): OutlineResult {
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (language === "json" || (trimmed.startsWith("{") || trimmed.startsWith("["))) {
    try {
      const obj = JSON.parse(trimmed);
      const path = Array.isArray(obj) ? ["[0]"] : ["root"];
      const root = buildJsonNode(obj, trimmed, path);
      if (!root) return null;
      const label = path[0] === "root" ? "root" : root.label;
      return { root: { ...root, label, path: path[0] === "root" ? ["root"] : root.path, children: root.children } };
    } catch {
      return null;
    }
  }

  if (language === "xml" || trimmed.startsWith("<")) {
    const root = getXmlOutline(trimmed);
    return root ? { root } : null;
  }
  return null;
}

export function getPathAtLine(root: OutlineNode, line: number): OutlineNode | null {
  let best: OutlineNode | null = null;
  function visit(node: OutlineNode) {
    if (node.line <= line) {
      if (!best || node.line >= best.line) best = node;
      node.children.forEach(visit);
    }
  }
  visit(root);
  return best;
}
