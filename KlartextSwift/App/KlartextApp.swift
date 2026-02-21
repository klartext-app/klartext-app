import SwiftUI

@main
struct KlartextApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .frame(minWidth: 700, minHeight: 450)
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
        }
    }
}
