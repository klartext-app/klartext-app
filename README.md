# Klartext

Moderner Texteditor mit Monaco Editor (VS-Code-Engine), JSON/XML-Formatierung und rahmenlosem Fenster (Custom Titlebar).

## Features

- **Monaco Editor** – gleiche Bearbeitungserfahrung wie in VS Code
- **Toolbar** – JSON Format, XML Format, Minify, Clear
- **Rahmenloses Design** – eigene Titelleiste unter Windows und macOS
- **Formatierung** – JSON (2 Leerzeichen), XML (fast-xml-parser), Minify für beide

## Voraussetzungen

- **Node.js** 18+
- **Rust** (für Tauri) – [rustup.rs](https://rustup.rs)
- **Windows**: Visual Studio Build Tools (z. B. „Desktop development with C++“)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)

## Installation & Start

```bash
# Abhängigkeiten
npm install

# Nur Frontend (Browser)
npm run dev

# Tauri-App (Desktop, benötigt Rust)
npm run tauri dev
```

## Build (Desktop)

```bash
npm run tauri build
```

Die gebündelte App liegt danach unter `src-tauri/target/release/` (Windows: `.exe`, macOS: `.app`).

## Projektstruktur

- `src/` – React-Frontend (Vite + TypeScript)
  - `App.tsx` – Layout, Toolbar, State
  - `Editor.tsx` – Monaco-Wrapper
  - `TitleBar.tsx` – Custom Titlebar (Minimize, Maximize, Close)
  - `formatters.ts` – JSON/XML Format & Minify
- `src-tauri/` – Tauri-Backend (Rust)
  - `tauri.conf.json` – u. a. `decorations: false` für rahmenloses Fenster

## Icons anpassen

Eigenes Icon für die App:

```bash
npm run tauri icon pfad/zum/icon.png
```

(Quelle: quadratisches PNG, z. B. 1024×1024.)
