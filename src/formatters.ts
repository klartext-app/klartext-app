import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const FORMAT_ERROR = "Das Zielformat wurde nicht erkannt.";

/**
 * Erkennt und formatiert eingefügten Text (JSON, XML oder YAML). Gibt null zurück, wenn kein gültiges Format.
 */
export function tryFormatPasted(
  text: string
): { formatted: string; language: "json" | "xml" | "yaml" } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return { formatted: JSON.stringify(parsed, null, 2), language: "json" };
    } catch {
      return null;
    }
  }
  if (trimmed.startsWith("<")) {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });
      const builder = new XMLBuilder({
        format: true,
        indentBy: "  ",
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });
      const parsed = parser.parse(trimmed);
      const result = builder.build(parsed);
      if (result != null && String(result).trim() !== "")
        return { formatted: result, language: "xml" };
    } catch {
      // ignore
    }
  }
  try {
    const parsed = parseYaml(trimmed);
    if (parsed !== undefined && parsed !== null) {
      return { formatted: stringifyYaml(parsed, { indent: 2 }), language: "yaml" };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Formatiert JSON mit Einrückung (2 Leerzeichen, Prettier-Stil).
 */
export function formatJson(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) throw new Error(FORMAT_ERROR);
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    throw new Error(FORMAT_ERROR);
  }
}

/**
 * Formatiert XML mit Einrückung (2 Leerzeichen).
 */
export function formatXml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (!trimmed.startsWith("<")) throw new Error(FORMAT_ERROR);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const builder = new XMLBuilder({
    format: true,
    indentBy: "  ",
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  try {
    const parsed = parser.parse(trimmed);
    const result = builder.build(parsed);
    if (result == null || String(result).trim() === "") throw new Error(FORMAT_ERROR);
    return result;
  } catch {
    throw new Error(FORMAT_ERROR);
  }
}

/**
 * Formatiert YAML mit Einrückung (2 Leerzeichen).
 */
export function formatYaml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  try {
    const parsed = parseYaml(trimmed);
    if (parsed === undefined) throw new Error(FORMAT_ERROR);
    return stringifyYaml(parsed, { indent: 2 });
  } catch {
    throw new Error(FORMAT_ERROR);
  }
}

/**
 * Minifiziert YAML (kompakte Ausgabe).
 */
export function minifyYaml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  try {
    const parsed = parseYaml(trimmed);
    if (parsed === undefined) throw new Error(FORMAT_ERROR);
    return stringifyYaml(parsed, { lineWidth: 0 });
  } catch {
    throw new Error(FORMAT_ERROR);
  }
}

/**
 * Minifiziert JSON (keine Leerzeichen/Zeilenumbrüche).
 */
export function minifyJson(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) throw new Error(FORMAT_ERROR);
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed);
  } catch {
    throw new Error(FORMAT_ERROR);
  }
}

/**
 * Minifiziert XML (keine unnötigen Leerzeichen).
 */
export function minifyXml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (!trimmed.startsWith("<")) throw new Error(FORMAT_ERROR);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const builder = new XMLBuilder({
    format: false,
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  try {
    const parsed = parser.parse(trimmed);
    const result = builder.build(parsed);
    if (result == null || String(result).trim() === "") throw new Error(FORMAT_ERROR);
    return result;
  } catch {
    throw new Error(FORMAT_ERROR);
  }
}
