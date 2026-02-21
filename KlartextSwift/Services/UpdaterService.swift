import Foundation

/// Stub for in-app updates. Wire up Sparkle once project is opened in Xcode on Mac.
class UpdaterService: NSObject, ObservableObject {
    override init() {
        super.init()
    }

    func checkForUpdates() {
        // No-op: Sparkle not linked in SPM build.
        // Add Sparkle via Xcode when building with a proper .xcodeproj.
    }
}
