import AppKit

struct UpdateChecker {
    private static let releasesURL = URL(string: "https://api.github.com/repos/klartext-app/klartext-app/releases/latest")!

    private static var currentVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0.0.0"
    }

    /// Beim App-Start: still prüfen, nur anzeigen wenn Update verfügbar
    static func checkSilently() async {
        guard let (latestVersion, downloadURL) = await fetchLatestRelease() else { return }
        guard isNewer(latestVersion, than: currentVersion) else { return }
        await showUpdateAlert(version: latestVersion, downloadURL: downloadURL, silent: true)
    }

    /// Auf expliziten Nutzer-Wunsch: immer Feedback geben
    static func checkAndNotify() async {
        guard let (latestVersion, downloadURL) = await fetchLatestRelease() else {
            await showErrorAlert()
            return
        }
        if isNewer(latestVersion, than: currentVersion) {
            await showUpdateAlert(version: latestVersion, downloadURL: downloadURL, silent: false)
        } else {
            await showUpToDateAlert()
        }
    }

    // MARK: - Private

    private static func fetchLatestRelease() async -> (version: String, downloadURL: URL)? {
        var request = URLRequest(url: releasesURL)
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")

        guard let (data, _) = try? await URLSession.shared.data(for: request),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let tagName = json["tag_name"] as? String,
              let assets = json["assets"] as? [[String: Any]],
              let dmgAsset = assets.first(where: { ($0["name"] as? String)?.hasSuffix(".dmg") == true }),
              let urlString = dmgAsset["browser_download_url"] as? String,
              let downloadURL = URL(string: urlString)
        else { return nil }

        let version = tagName.hasPrefix("v") ? String(tagName.dropFirst()) : tagName
        return (version, downloadURL)
    }

    private static func isNewer(_ version: String, than current: String) -> Bool {
        let a = version.split(separator: ".").compactMap { Int($0) }
        let b = current.split(separator: ".").compactMap { Int($0) }
        for i in 0..<max(a.count, b.count) {
            let av = i < a.count ? a[i] : 0
            let bv = i < b.count ? b[i] : 0
            if av != bv { return av > bv }
        }
        return false
    }

    @MainActor
    private static func showUpdateAlert(version: String, downloadURL: URL, silent: Bool) {
        let brewCommand = "brew upgrade --cask klartext"

        let alert = NSAlert()
        alert.messageText = "Update verfügbar: v\(version)"
        alert.informativeText = "Du verwendest v\(currentVersion). Führe folgenden Befehl im Terminal aus:\n\n\(brewCommand)"
        alert.addButton(withTitle: "Befehl kopieren")
        alert.addButton(withTitle: "Später")
        alert.alertStyle = .informational

        if alert.runModal() == .alertFirstButtonReturn {
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(brewCommand, forType: .string)
        }
    }

    @MainActor
    private static func showUpToDateAlert() {
        let alert = NSAlert()
        alert.messageText = "Klartext ist aktuell"
        alert.informativeText = "Du verwendest bereits die neueste Version (v\(currentVersion))."
        alert.addButton(withTitle: "OK")
        alert.alertStyle = .informational
        alert.runModal()
    }

    @MainActor
    private static func showErrorAlert() {
        let alert = NSAlert()
        alert.messageText = "Update-Prüfung fehlgeschlagen"
        alert.informativeText = "Die aktuelle Version konnte nicht abgerufen werden. Bitte prüfe deine Internetverbindung."
        alert.addButton(withTitle: "OK")
        alert.alertStyle = .warning
        alert.runModal()
    }
}
