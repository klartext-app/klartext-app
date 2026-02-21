import SwiftUI

struct StatusBarView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject var settings = AppSettings.shared
    let lineCount: Int

    private var appVersion: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? ""
    }

    var body: some View {
        HStack(spacing: 0) {
            // Zeilen-Anzahl
            Text(lineCountText)
                .statusItem()

            StatusSeparator()

            // Format
            Text(appState.activeTab.language.displayName)
                .statusItem()

            StatusSeparator()

            // Fehler
            if let error = appState.error {
                StatusSeparator()
                Text(error)
                    .font(.system(size: 11))
                    .foregroundColor(Color(red: 1.0, green: 0.4, blue: 0.4))
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .frame(maxWidth: 320, alignment: .leading)
                    .padding(.horizontal, 8)
            }

            Spacer()

            // Version
            if !appVersion.isEmpty {
                StatusSeparator()
                Text("v\(appVersion)")
                    .statusItem()
            }
        }
        .frame(height: 22)
        .background(Color(red: 0.06, green: 0.07, blue: 0.10))
    }

    private var lineCountText: String {
        let n = lineCount
        if settings.uiLanguage == .de {
            return "\(n) \(n == 1 ? "Zeile" : "Zeilen")"
        } else {
            return "\(n) \(n == 1 ? "line" : "lines")"
        }
    }
}

struct StatusSeparator: View {
    var body: some View {
        Rectangle()
            .fill(Color(white: 0.18))
            .frame(width: 1, height: 14)
            .padding(.horizontal, 4)
    }
}

extension Text {
    func statusItem() -> some View {
        self
            .font(.system(size: 11))
            .foregroundColor(Color(white: 0.5))
            .padding(.horizontal, 8)
    }
}
