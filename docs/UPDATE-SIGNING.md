# In-App-Updates: Signing einrichten

Damit Nutzer in der App „Nach Updates suchen“ nutzen können, müssen die Builds signiert werden. Dafür brauchst du einmalig Signing-Keys und ein GitHub-Secret.

## 1. Keys erzeugen (einmalig)

Im Projektordner (oder beliebig):

```bash
npm run tauri signer generate -w ~/.tauri/klartext.key
```

- Es werden zwei Dateien erzeugt (z. B. `klartext.key` und `klartext.key.pub`).
- **Private Key** (`klartext.key`): Niemals teilen, sicher aufbewahren. Wer ihn hat, kann gültige Updates ausliefern.
- **Public Key** (`klartext.key.pub`): Wird in die App-Konfiguration eingetragen.

## 2. Public Key in die App eintragen

1. Inhalt von `klartext.key.pub` öffnen (eine lange Zeile).
2. In **`src-tauri/tauri.conf.json`** den Platzhalter ersetzen:
   - Suche nach `"pubkey": "REPLACE_WITH_PUBLIC_KEY"`.
   - Ersetze `REPLACE_WITH_PUBLIC_KEY` durch den **kompletten Inhalt** der `.pub`-Datei (eine Zeile, in Anführungszeichen).

## 3. GitHub-Secrets für CI

Damit der Release-Workflow signierte Updater-Artefakte und `latest.json` erzeugen kann:

1. Auf **GitHub** → Repo **klartext-app/klartext-app** → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**:
   - Name: `TAURI_SIGNING_PRIVATE_KEY`
   - Value: **kompletter Inhalt** der Datei `klartext.key` (Private Key, eine Zeile).
3. **Falls beim Generieren ein Passwort gesetzt wurde**, zusätzlich:
   - Name: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
   - Value: Das Passwort, das beim `tauri signer generate` verwendet wurde.
4. Speichern.

**Hinweis:** Wenn beim Generieren **kein Passwort** gesetzt wurde, kann `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` leer bleiben oder weggelassen werden.

Ab dem nächsten Release (Tag-Push) baut die Action die Installer mit Signatur und lädt `latest.json` ins Release hoch. Die App prüft dann gegen `releases/latest/download/latest.json` und kann Updates anbieten.

## Kurzfassung

- Keys: `npm run tauri signer generate -w ~/.tauri/klartext.key`
- Public Key → `tauri.conf.json` unter `plugins.updater.pubkey`
- Private Key → GitHub Secret `TAURI_SIGNING_PRIVATE_KEY`
