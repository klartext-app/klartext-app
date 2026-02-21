import SwiftUI
import AppKit

@main
struct KlartextApp: App {
    @StateObject private var appState = AppState()
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .frame(minWidth: 700, minHeight: 450)
                .onAppear {
                    NSApp.windows.forEach { configureWindow($0) }
                }
                .task {
                    await UpdateChecker.checkSilently()
                }
        }
        .windowStyle(.hiddenTitleBar)
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("Neuer Tab") {
                    appState.addTab()
                }
                .keyboardShortcut("t", modifiers: .command)
            }
            CommandGroup(replacing: .saveItem) {
                Button("Speichern") {
                    Task { await appState.saveActiveTab() }
                }
                .keyboardShortcut("s", modifiers: .command)

                Button("Öffnen…") {
                    Task { await appState.openFile() }
                }
                .keyboardShortcut("o", modifiers: .command)
            }
            CommandGroup(after: .appInfo) {
                Button("Nach Updates suchen…") {
                    Task { await UpdateChecker.checkAndNotify() }
                }
            }
        }
    }
}

private func configureWindow(_ window: NSWindow) {
    window.collectionBehavior.insert(.fullScreenPrimary)
    window.isMovableByWindowBackground = true
}

class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows: Bool) -> Bool {
        if !hasVisibleWindows {
            sender.windows.first?.makeKeyAndOrderFront(nil)
        }
        return true
    }
}
