# Klartext

Moderner Texteditor mit JSON/XML/YAML-Formatierung für macOS. Gebaut mit Swift + SwiftUI.

## Features

- **JSON, XML, YAML** formatieren und minifizieren
- **Konvertierungen**: JSON↔YAML, JSON↔XML
- **Auto-Format** beim Einfügen (konfigurierbar)
- **Tabs** mit Dirty-Indikator, Session-Persistenz und Rechtsklick-Umbenennung
- **Sidebar** mit Document Outline (JSON/XML-Struktur)
- **Breadcrumbs** für aktuellen Dokumentpfad
- **Suche & Ersetzen** mit CodeMirror
- **Auto-Save** (konfigurierbar)
- **Diff-Ansicht** (Vergleich zweier Texte)
- **Drag & Drop** für JSON/XML/YAML/TXT-Dateien
- **Dateiverknüpfungen** für .json, .xml, .xsl, .yaml, .yml, .txt
- **Statusleiste** mit Zeilenzahl und erkanntem Format
- **Einstellungen**: Sprache (DE/EN), Favorisierte Formate, Auto-Save, Update-Check
- **In-App-Updates** (Update-Check via GitHub API)
- **Schriftgröße** anpassbar (10–28 px)

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

Falls macOS meldet „App ist beschädigt" oder sie sich nicht öffnen lässt:
```bash
sudo xattr -r -d com.apple.quarantine /Applications/Klartext.app
```

> **Hinweis:** Bei der Installation über Homebrew ist dieser Schritt nicht nötig – das Quarantine-Flag wird automatisch entfernt.
