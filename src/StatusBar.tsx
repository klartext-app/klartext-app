interface StatusBarProps {
  lineCount: number;
  format: "JSON" | "XML" | "Plain Text" | "YAML";
  cursorLine: number;
  cursorColumn: number;
}

export function StatusBar({ lineCount, format, cursorLine, cursorColumn }: StatusBarProps) {
  return (
    <footer className="statusbar">
      <span className="statusbar-item">
        {lineCount} {lineCount === 1 ? "Zeile" : "Zeilen"}
      </span>
      <span className="statusbar-sep" />
      <span className="statusbar-item">{format}</span>
      <span className="statusbar-sep" />
      <span className="statusbar-item">
        Zeile {cursorLine} : Spalte {cursorColumn}
      </span>
    </footer>
  );
}
