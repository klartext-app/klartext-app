import SwiftUI

struct ToolbarView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject var settings = AppSettings.shared

    var body: some View {
        HStack(spacing: 2) {
            // Datei-Aktionen
            ToolbarButton(icon: "folder.badge.plus", title: settings.label("Öffnen", "Open")) {
                Task { await appState.openFile() }
            }
            ToolbarButton(icon: "square.and.arrow.down", title: settings.label("Speichern", "Save")) {
                Task { await appState.saveActiveTab() }
            }
            ToolbarButton(icon: "plus.square", title: settings.label("Neuer Tab", "New tab")) {
                appState.addTab()
            }
            ToolbarButton(
                icon: "sidebar.left",
                title: settings.label("Struktur", "Structure"),
                isActive: appState.sidebarOpen
            ) {
                appState.sidebarOpen.toggle()
            }

            Divider().frame(height: 20).padding(.horizontal, 4)

            // Format-Buttons (gefiltert nach Favoriten)
            if settings.favoriteJson || settings.favoriteXml || settings.favoriteYaml {
                Group {
                    if settings.favoriteJson {
                        ToolbarButton(icon: "curlybraces", title: "JSON") {
                            appState.formatJson()
                        }
                    }
                    if settings.favoriteXml {
                        ToolbarButton(icon: "chevron.left.forwardslash.chevron.right", title: "XML") {
                            appState.formatXml()
                        }
                    }
                    if settings.favoriteYaml {
                        ToolbarButton(icon: "doc.plaintext", title: "YAML") {
                            appState.formatYaml()
                        }
                    }
                }
            } else {
                ToolbarButton(icon: "curlybraces", title: "JSON") { appState.formatJson() }
                ToolbarButton(icon: "chevron.left.forwardslash.chevron.right", title: "XML") { appState.formatXml() }
                ToolbarButton(icon: "doc.plaintext", title: "YAML") { appState.formatYaml() }
            }

            Divider().frame(height: 20).padding(.horizontal, 4)

            ToolbarButton(icon: "arrow.left.and.right.text.vertical", title: settings.label("Minify", "Minify")) {
                appState.minify()
            }
            ToolbarButton(icon: "trash", title: settings.label("Leeren", "Clear")) {
                appState.clearContent()
            }
            ToolbarButton(icon: "arrow.left.arrow.right.square", title: settings.label("Vergleichen", "Compare")) {
                appState.startDiff()
            }

            Divider().frame(height: 20).padding(.horizontal, 4)

            // Auto-Format Toggle
            Toggle(isOn: .constant(false)) {
                Text(settings.label("Auto-Format", "Auto-format"))
                    .font(.system(size: 11))
                    .foregroundColor(Color(white: 0.7))
            }
            .toggleStyle(.checkbox)
            .padding(.horizontal, 4)

            Divider().frame(height: 20).padding(.horizontal, 4)

            // Schriftgröße
            HStack(spacing: 4) {
                Button("A-") {
                    settings.fontSize = max(10, settings.fontSize - 1)
                }
                .buttonStyle(GhostButtonStyle())
                .font(.system(size: 11))

                Text("\(settings.fontSize)px")
                    .font(.system(size: 11))
                    .foregroundColor(Color(white: 0.6))
                    .frame(width: 34)

                Button("A+") {
                    settings.fontSize = min(28, settings.fontSize + 1)
                }
                .buttonStyle(GhostButtonStyle())
                .font(.system(size: 11))
            }

            Divider().frame(height: 20).padding(.horizontal, 4)

            ToolbarButton(icon: "gearshape", title: settings.label("Einstellungen", "Settings")) {
                appState.settingsOpen = true
            }
            ToolbarButton(
                icon: "magnifyingglass",
                title: settings.label("Suche", "Search"),
                isActive: appState.searchOpen
            ) {
                appState.searchOpen.toggle()
            }

            Spacer()
        }
        .padding(.horizontal, 8)
        .frame(height: 44)
        .background(.ultraThinMaterial)
    }
}

// MARK: - Subviews

struct ToolbarButton: View {
    let icon: String
    let title: String
    var isActive: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 15))
                .foregroundColor(isActive ? Color(red: 0.49, green: 0.73, blue: 0.91) : Color(white: 0.75))
                .frame(width: 30, height: 30)
                .background(isActive ? Color(white: 0.15) : Color.clear)
                .cornerRadius(5)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .help(title)
    }
}

struct GhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(Color(white: 0.75))
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(configuration.isPressed ? Color(white: 0.15) : Color.clear)
            .cornerRadius(4)
            .contentShape(Rectangle())
    }
}
