# Klartext per Homebrew installieren (macOS)

Klartext ist über den Tap **klartext-app/homebrew-klartext** mit Homebrew installierbar.

---

## Nutzer-Installation (macOS)

```bash
brew tap klartext-app/klartext
brew install --cask klartext
```

---

## Tap einrichten (einmalig)

Das Repo **klartext-app/homebrew-klartext** ist bereits angelegt. So bringst du den Cask dort hinein:

1. **Ordnerstruktur im Tap-Repo**
   - Im Repo **homebrew-klartext** einen Ordner **`Casks/`** anlegen.

2. **Cask kopieren**
   - Datei **`packaging/homebrew/Casks/klartext.rb`** aus dem Klartext-App-Repo nach **`Casks/klartext.rb`** im Tap-Repo kopieren (oder Inhalt übernehmen).

3. **Nach dem ersten GitHub-Release: Version und SHA256 eintragen**
   - Der Release-Workflow (Tag `v*`) erzeugt z. B. `Klartext_0.1.0_aarch64.dmg` und `Klartext_0.1.0_x86_64.dmg`.
   - SHA256 berechnen (macOS/Linux):
     ```bash
     curl -sL -o /tmp/Klartext.dmg "https://github.com/klartext-app/klartext-app/releases/download/v0.1.0/Klartext_0.1.0_aarch64.dmg"
     shasum -a 256 /tmp/Klartext.dmg
     ```
     (Für x86_64 die entsprechende .dmg-URL verwenden.)
   - In **`Casks/klartext.rb`** im Tap-Repo:
     - **version** auf die Release-Version setzen (z. B. `0.1.0`).
     - `REPLACE_WITH_ARM64_DMG_SHA256` durch den SHA256 der **aarch64**.dmg ersetzen.
     - `REPLACE_WITH_X86_64_DMG_SHA256` durch den SHA256 der **x86_64**.dmg ersetzen.
   - Änderungen committen und pushen.

---

## Bei neuen Releases

- **version** und beide **sha256**-Werte in **`Casks/klartext.rb`** im Repo **homebrew-klartext** anpassen und pushen.
- Optional: GitHub Action einrichten, die bei jedem Release in klartext-app die Cask-Version und SHA256 aktualisiert (z. B. [Homebrew Releaser](https://github.com/marketplace/actions/homebrew-releaser)).

---

## Dateinamen der Release-Assets (macOS)

Der Release-Workflow baut:

- **macOS:** `Klartext_<version>_aarch64.dmg` und `Klartext_<version>_x86_64.dmg`

Wenn sich die Dateinamen ändern, die URLs in **`klartext.rb`** anpassen.
