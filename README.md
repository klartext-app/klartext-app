# Klartext

**Klartext** ist ein moderner, plattformübergreifender Texteditor für strukturierte Datenformate. Entwickelt mit [Tauri](https://tauri.app) und [Monaco Editor](https://microsoft.github.io/monaco-editor/) (die gleiche Editoren-Engine wie in VS Code).

## Überblick

Klartext ist spezialisiert auf die Bearbeitung und Formatierung von **JSON**, **XML** und **YAML**-Dateien. Die App bietet eine native Desktop-Erfahrung mit einem rahmenlosen Fensterdesign und einer intuitiven Benutzeroberfläche.

### Hauptmerkmale

- **Monaco Editor** – professionelle Code-Editierung mit Syntax-Highlighting, Auto-Vervollständigung und der gleichen Bearbeitungserfahrung wie in VS Code
- **Multi-Tab-Interface** – mehrere Dateien gleichzeitig bearbeiten
- **Intelligente Formatierung** – automatische Erkennung und Formatierung von JSON, XML und YAML
- **Document Outline** – Strukturbaum-Navigation für große Dateien mit Zeilensprung
- **Diff-Ansicht** – visueller Vergleich von Dateiinhalten
- **Drag & Drop** – Dateien einfach per Drag & Drop öffnen
- **Auto-Format beim Einfügen** – erkennt und formatiert eingefügten Code automatisch
- **In-App-Updates** – automatische Update-Benachrichtigungen und Installation
- **Persistenz** – Tabs und Inhalte werden automatisch gespeichert

## Features im Detail

### Formatierung & Minify

- **JSON**: Formatierung mit 2 Leerzeichen Einrückung (Prettier-Stil)
- **XML**: Formatierung mit 2 Leerzeichen Einrückung
- **YAML**: Formatierung mit 2 Leerzeichen Einrückung
- **Minify**: Kompakte Ausgabe für alle drei Formate (keine Leerzeichen/Zeilenumbrüche)

### Navigation & Struktur

- **Document Outline**: Seitenleiste mit Strukturbaum für JSON/XML-Dateien
- **Breadcrumbs**: Zeigt den aktuellen Pfad im Dokument basierend auf der Cursor-Position
- **Zeilen-Navigation**: Klick auf Outline-Elemente springt zur entsprechenden Zeile

### Vergleich & Bearbeitung

- **Diff-Ansicht**: Side-by-Side-Vergleich von Original und geänderter Version
- **Multi-Tab**: Mehrere Dateien gleichzeitig in Tabs bearbeiten
- **Statusleiste**: Zeigt Zeilenanzahl, Format-Typ und Cursor-Position

### Benutzeroberfläche

- **Rahmenloses Design**: Eigene Titelleiste unter Windows und macOS
- **Midnight-Theme**: Dunkles Farbschema für angenehmes Arbeiten
- **Resizable Sidebar**: Document Outline kann in der Breite angepasst werden
- **Custom Titlebar**: Minimize, Maximize, Close-Buttons

## Installation

### macOS (Homebrew)

```bash
brew tap klartext-app/klartext
brew install --cask klartext
```

**Hinweis (macOS Gatekeeper, unsignierte App):**  
Klartext ist derzeit nicht mit einem Apple-Developer-Zertifikat signiert. macOS kann daher beim ersten Start melden, dass die App beschädigt sei oder von einem nicht verifizierten Entwickler stammt.

So kannst du die App trotzdem starten:

- Im Finder zu `Programme` → `Klartext.app` gehen
- Rechtsklick → **Öffnen** → im Dialog erneut **Öffnen** wählen

Alternativ im Terminal:

```bash
sudo xattr -r -d com.apple.quarantine "/Applications/Klartext.app"
```

### Windows & macOS (Manuell)

Lade die Installer von den [GitHub Releases](https://github.com/klartext-app/klartext-app/releases) herunter:

- **macOS**: `.dmg`-Datei
- **Windows**: `.msi`-Installer

## Updates

Klartext prüft automatisch auf Updates. Klicke auf den **Download-Button** in der Toolbar, um manuell nach Updates zu suchen.

## Entwicklung

### Voraussetzungen

- **Node.js** 18+
- **Rust** (für Tauri) – [rustup.rs](https://rustup.rs)
- **Windows**: Visual Studio Build Tools (z. B. „Desktop development with C++“)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)

### Lokal starten

```bash
# Abhängigkeiten installieren
npm install

# Frontend im Browser (Development)
npm run dev

# Desktop-App starten (benötigt Rust)
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

Die gebündelte App liegt danach unter `src-tauri/target/release/` (Windows: `.exe`, macOS: `.app`).

### Icons anpassen

Eigenes Icon für die App:

```bash
npm run tauri icon pfad/zum/icon.png
```

(Quelle: quadratisches PNG, z. B. 1024×1024.)

## Projektstruktur

```
Klartext/
├── src/                    # React-Frontend (Vite + TypeScript)
│   ├── App.tsx            # Hauptkomponente, Layout, Toolbar, State
│   ├── Editor.tsx         # Monaco Editor Wrapper
│   ├── TitleBar.tsx       # Custom Titlebar (Minimize, Maximize, Close)
│   ├── DiffEditorView.tsx # Diff-Ansicht für Vergleich
│   ├── DocumentOutline.tsx # Strukturbaum-Sidebar
│   ├── Breadcrumbs.tsx    # Pfad-Navigation
│   ├── StatusBar.tsx      # Statusleiste (Zeilen, Format, Cursor)
│   ├── formatters.ts      # JSON/XML/YAML Formatierung & Minify
│   ├── outline.ts         # Document Outline-Logik
│   ├── fileService.ts     # Datei-Öffnen/Speichern (Tauri)
│   ├── usePersistedTabs.ts # Tab-Persistenz (localStorage)
│   └── useDragDrop.ts     # Drag & Drop-Handler
├── src-tauri/             # Tauri-Backend (Rust)
│   ├── src/
│   │   └── lib.rs         # Tauri-Konfiguration, Plugins
│   └── tauri.conf.json    # App-Konfiguration
├── .github/workflows/     # GitHub Actions (Release-Builds)
└── docs/                  # Dokumentation
    ├── INSTALL.md         # Homebrew-Installation
    └── UPDATE-SIGNING.md  # In-App-Updates einrichten
```

## Release-Skripte (nur für Maintainer)

Im Ordner `scripts/` liegen kleine Hilfs-Skripte, die **nicht** Teil der Laufzeit-App sind, sondern nur für Build/Release genutzt werden:

- `scripts/update-version.mjs` – setzt Version in `package.json` und `src-tauri/tauri.conf.json` anhand des Tags (wird in der GitHub Action `release.yml` verwendet).
- `scripts/ensure-windows-ico.mjs` – erzeugt bei Bedarf `src-tauri/icons/icon.ico` aus `32x32.png` (wird im Windows-Job der GitHub Action verwendet).
- `scripts/update-homebrew-cask.mjs` – Hilfsskript, um SHA256-Hashes der macOS-`.dmg`-Dateien zu berechnen und für den Homebrew-Tap auszugeben.

## Technologie-Stack

- **Frontend**: React 18, TypeScript, Vite
- **Editor**: Monaco Editor (VS Code Engine)
- **Backend**: Tauri 2 (Rust)
- **Formatierung**: 
  - JSON: Native JavaScript `JSON.parse/stringify`
  - XML: [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser)
  - YAML: [yaml](https://github.com/eemeli/yaml)
- **Icons**: [lucide-react](https://lucide.dev)

## Lizenz

MIT

## Links

- **Releases**: https://github.com/klartext-app/klartext-app/releases
- **Homebrew Tap**: https://github.com/klartext-app/homebrew-klartext
