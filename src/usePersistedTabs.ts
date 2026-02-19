import { useEffect, useRef, useCallback } from "react";
import type { Tab } from "./App";

const STORAGE_KEY = "klartext-tabs";
const ACTIVE_KEY = "klartext-active-id";

export interface PersistedState {
  tabs: Tab[];
  activeId: string;
}

function load(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const tabs = JSON.parse(raw) as unknown;
    if (!Array.isArray(tabs) || tabs.length === 0) return null;
    const validTabs = tabs
      .filter(
        (t: unknown) =>
          t &&
          typeof t === "object" &&
          typeof (t as Tab).id === "string" &&
          typeof (t as Tab).title === "string" &&
          typeof (t as Tab).content === "string"
      )
      .map((t: unknown) => {
        const tab = t as Record<string, unknown>;
        return {
          id: tab.id as string,
          title: tab.title as string,
          content: tab.content as string,
          filePath: (tab.filePath as string | null) ?? null,
          language: (tab.language === "json" || tab.language === "xml" || tab.language === "yaml" ? tab.language : "plaintext") as Tab["language"],
        };
      }) as Tab[];
    if (validTabs.length === 0) return null;
    const id = activeId && validTabs.some((t) => t.id === activeId) ? activeId : validTabs[0].id;
    return { tabs: validTabs, activeId: id };
  } catch {
    return null;
  }
}

function save(tabs: Tab[], activeId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    localStorage.setItem(ACTIVE_KEY, activeId);
  } catch {
    // ignore
  }
}

/**
 * Lädt beim Mount persistierte Tabs (falls vorhanden) und speichert bei Änderungen + vor Fenster-Schließen.
 */
export function usePersistedTabs(
  tabs: Tab[],
  activeId: string,
  setTabs: (tabs: Tab[]) => void,
  setActiveId: (id: string) => void
) {
  const skipNextSave = useRef(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const state = load();
      if (state) {
        skipNextSave.current = true;
        setTabs(state.tabs);
        setActiveId(state.activeId);
      }
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    save(tabs, activeId);
  }, [tabs, activeId]);

  const saveOnUnload = useCallback(() => {
    save(tabs, activeId);
  }, [tabs, activeId]);

  useEffect(() => {
    window.addEventListener("beforeunload", saveOnUnload);
    return () => window.removeEventListener("beforeunload", saveOnUnload);
  }, [saveOnUnload]);
}
