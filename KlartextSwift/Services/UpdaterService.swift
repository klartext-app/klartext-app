import Foundation
import Sparkle

/// Wrapper für Sparkle-In-App-Updates.
/// Sparkle muss als Swift Package hinzugefügt werden:
/// https://github.com/sparkle-project/Sparkle (ab Version 2.x)
class UpdaterService: NSObject, ObservableObject {
    private var updater: SPUUpdater?
    private var updaterController: SPUStandardUpdaterController?

    override init() {
        super.init()
        // Sparkle-Controller initialisieren
        // Die appcast URL wird in Info.plist via SUFeedURL gesetzt
        updaterController = SPUStandardUpdaterController(
            startingUpdater: true,
            updaterDelegate: nil,
            userDriverDelegate: nil
        )
        updater = updaterController?.updater
    }

    func checkForUpdates() {
        updaterController?.checkForUpdates(nil)
    }
}
