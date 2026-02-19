import { useEffect, useState } from "react";
import { isTauriEnv } from "./fileService";

interface StatusBarProps {
  lineCount: number;
  format: "JSON" | "XML" | "Plain Text" | "YAML";
  language: "de" | "en";
  error?: string | null;
}

export function StatusBar({ lineCount, format, language, error }: StatusBarProps) {
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauriEnv()) return;
    let cancelled = false;
    import("@tauri-apps/api/app")
      .then(({ getVersion }) => getVersion())
      .then((v) => {
        if (!cancelled) setAppVersion(v);
      })
      .catch(() => {
        if (!cancelled) setAppVersion(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="statusbar">
      <span className="statusbar-item">
        {lineCount}{" "}
        {lineCount === 1
          ? language === "de"
            ? "Zeile"
            : "line"
          : language === "de"
            ? "Zeilen"
            : "lines"}
      </span>
      <span className="statusbar-sep" />
      <span className="statusbar-item">{format}</span>
      <span className="statusbar-sep" />
      {error && (
        <>
          <span className="statusbar-sep" />
          <span className="statusbar-item statusbar-error">{error}</span>
        </>
      )}
      <span className="statusbar-sep" />
      <span className="statusbar-item statusbar-version">
        {appVersion ? `v${appVersion}` : ""}
      </span>
    </footer>
  );
}
