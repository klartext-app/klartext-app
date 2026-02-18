import { useState, useEffect } from "react";

/** Läuft die App in der Tauri-Desktop-Umgebung? */
function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window || "__TAURI__" in window;
}

type Win = {
  minimize: () => void;
  toggleMaximize: () => Promise<void>;
  close: () => void;
};

export function TitleBar() {
  const [win, setWin] = useState<Win | null>(null);

  useEffect(() => {
    if (!isTauri()) return;
    import("@tauri-apps/api/window")
      .then((m) => setWin(m.getCurrentWindow()))
      .catch(() => {});
  }, []);

  const handleMaximize = async () => {
    if (!win) return;
    try {
      await win.toggleMaximize();
    } catch {}
  };

  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar-left" data-tauri-drag-region>
        <span className="titlebar-title" data-tauri-drag-region>Klartext</span>
      </div>
      <div className="titlebar-right">
        {win ? (
          <>
            <button
              type="button"
              className="titlebar-btn"
              onClick={() => win.minimize()}
              aria-label="Minimieren"
            >
              <MinimizeIcon />
            </button>
            <button
              type="button"
              className="titlebar-btn"
              onClick={handleMaximize}
              aria-label="Maximieren"
            >
              <MaximizeIcon />
            </button>
            <button
              type="button"
              className="titlebar-btn close"
              onClick={() => win.close()}
              aria-label="Schließen"
            >
              <CloseIcon />
            </button>
          </>
        ) : (
          <span className="titlebar-browser-hint">Browser-Vorschau</span>
        )}
      </div>
    </header>
  );
}

function MinimizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <rect x="0" y="4" width="10" height="1" />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <rect x="0" y="0" width="10" height="10" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M0 0L10 10M10 0L0 10" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
