# Klartext

Moderner Texteditor mit JSON/XML/YAML-Formatierung für macOS. Gebaut mit Swift + SwiftUI.

## Features

- **JSON, XML, YAML** formatieren, minifizieren und konvertieren
- **Konvertierungen**: JSON↔YAML, JSON↔XML
- **Tabs** mit Dirty-Indikator und Session-Persistenz
- **Sidebar** mit Document Outline (JSON/XML-Struktur)
- **Breadcrumbs** für aktuellen Dokumentpfad
- **Suche & Ersetzen** via CodeMirror
- **Auto-Save** (konfigurierbar)
- **Diff-Ansicht** (Vergleich Original vs. aktuell)
- **Drag & Drop** für JSON/XML/YAML/TXT-Dateien
- **Dateiverknüpfungen** für .json, .xml, .yaml
- **Einstellungen**: Sprache (DE/EN), Favorisierte Formate, Auto-Save
- **In-App-Updates** (Update-Check via GitHub API)
- **Schriftgröße** anpassbar (10–28 px)

## Voraussetzungen

- macOS 13.0+
- Xcode 15+
- Node.js 18+ (für CodeMirror-Bundle)

## Entwicklung

### 1. Repo klonen

```bash
git clone https://github.com/klartext-app/klartext-app.git
cd klartext-app
```

### 2. CodeMirror-Bundle bauen

```bash
cd editor-bundle
npm install
npm run build
```

Das Bundle wird nach `KlartextSwift/Resources/editor/codemirror.bundle.js` geschrieben.

### 3. In Xcode öffnen

```bash
open KlartextSwift.xcodeproj
```

Dann `⌘R` zum Starten.

### 4. Für Änderungen am Editor

```bash
cd editor-bundle
npm run dev   # Watch-Mode mit Hot-Rebuild
```

## Release

Ein Release wird automatisch via GitHub Actions gebaut wenn ein Tag gepusht wird:

```bash
git tag v0.2.0
git push origin v0.2.0
```

## Homebrew

```bash
brew tap klartext-app/klartext
brew install --cask klartext
```

> **Hinweis:** Während der Installation kann macOS fragen ob Git auf den Schlüsselbund zugreifen darf (`git-credential-osxkeychain`). Das ist eine normale macOS-Sicherheitsabfrage – du kannst sie mit **„Nicht erlauben"** ablehnen. Die Installation läuft trotzdem vollständig durch, da das Tap-Repo öffentlich ist und keine Anmeldung benötigt.

## Installation (manuell)

1. `.dmg` von [Releases](https://github.com/klartext-app/klartext-app/releases) herunterladen
2. App in den Programme-Ordner ziehen
3. Beim ersten Start: Rechtsklick → Öffnen (Gatekeeper-Warnung umgehen)

Falls "App ist beschädigt": 
```bash
sudo xattr -r -d com.apple.quarantine /Applications/Klartext.app
```
