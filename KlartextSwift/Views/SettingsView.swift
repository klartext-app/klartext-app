import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject var settings = AppSettings.shared

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Text(settings.label("Einstellungen", "Settings"))
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                Spacer()
                Button {
                    appState.settingsOpen = false
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundColor(Color(white: 0.4))
                }
                .buttonStyle(.plain)
            }
            .padding(16)

            Divider().background(Color(white: 0.15))

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Sprache
                    SettingsSection(title: settings.label("Sprache", "Language")) {
                        HStack(spacing: 16) {
                            ForEach(UiLanguage.allCases, id: \.self) { lang in
                                RadioButton(
                                    title: lang.displayName,
                                    isSelected: settings.uiLanguage == lang
                                ) {
                                    settings.uiLanguage = lang
                                }
                            }
                        }
                    }

                    // Favorisierte Formate
                    SettingsSection(title: settings.label("Favorisierte Formate", "Favorite formats")) {
                        VStack(alignment: .leading, spacing: 8) {
                            SettingsCheckbox(title: "JSON", isOn: $settings.favoriteJson)
                            SettingsCheckbox(title: "XML", isOn: $settings.favoriteXml)
                            SettingsCheckbox(title: "YAML", isOn: $settings.favoriteYaml)
                        }
                    }

                    // Speichern
                    SettingsSection(title: settings.label("Speichern", "Save")) {
                        SettingsCheckbox(
                            title: settings.label("Auto-Speichern", "Auto-save"),
                            isOn: $settings.autoSave
                        )
                    }
                }
                .padding(16)
            }

            Divider().background(Color(white: 0.15))

            // Schließen-Button
            HStack {
                Spacer()
                Button(settings.label("Schließen", "Close")) {
                    appState.settingsOpen = false
                }
                .buttonStyle(PrimaryButtonStyle())
            }
            .padding(16)
        }
        .frame(width: 320)
        .background(Color(red: 0.10, green: 0.12, blue: 0.17))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.5), radius: 20)
    }
}

// MARK: - Helper Views

struct SettingsSection<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(white: 0.45))
                .textCase(.uppercase)
                .tracking(0.5)
            content()
        }
    }
}

struct SettingsCheckbox: View {
    let title: String
    @Binding var isOn: Bool

    var body: some View {
        Toggle(isOn: $isOn) {
            Text(title)
                .font(.system(size: 13))
                .foregroundColor(Color(white: 0.8))
        }
        .toggleStyle(.checkbox)
    }
}

struct RadioButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                ZStack {
                    Circle()
                        .stroke(isSelected ? Color(red: 0.49, green: 0.73, blue: 0.91) : Color(white: 0.35), lineWidth: 1.5)
                        .frame(width: 16, height: 16)
                    if isSelected {
                        Circle()
                            .fill(Color(red: 0.49, green: 0.73, blue: 0.91))
                            .frame(width: 8, height: 8)
                    }
                }
                Text(title)
                    .font(.system(size: 13))
                    .foregroundColor(Color(white: 0.8))
            }
        }
        .buttonStyle(.plain)
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 13))
            .foregroundColor(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 6)
            .background(Color(red: 0.18, green: 0.22, blue: 0.30))
            .cornerRadius(6)
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}
