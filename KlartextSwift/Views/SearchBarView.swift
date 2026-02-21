import SwiftUI

struct SearchBarView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject var settings = AppSettings.shared
    @Binding var searchQuery: String
    @Binding var replaceQuery: String
    var editorCoordinator: EditorWebView.Coordinator?

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 12))
                .foregroundColor(Color(white: 0.45))

            TextField(settings.label("Suchen…", "Search…"), text: $searchQuery)
                .textFieldStyle(.plain)
                .font(.system(size: 12))
                .foregroundColor(.white)
                .frame(width: 160)
                .onSubmit { editorCoordinator?.runSearch(searchQuery) }

            TextField(settings.label("Ersetzen…", "Replace…"), text: $replaceQuery)
                .textFieldStyle(.plain)
                .font(.system(size: 12))
                .foregroundColor(.white)
                .frame(width: 140)

            SearchBarButton(title: settings.label("Suchen", "Search")) {
                editorCoordinator?.runSearch(searchQuery)
            }
            SearchBarButton(title: "↑") {
                editorCoordinator?.runSearchPrev()
            }
            SearchBarButton(title: "↓") {
                editorCoordinator?.runSearchNext()
            }
            SearchBarButton(title: settings.label("Ersetzen", "Replace all")) {
                editorCoordinator?.runReplaceAll(searchQuery, replacement: replaceQuery)
            }

            Spacer()

            Button {
                appState.searchOpen = false
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 11))
                    .foregroundColor(Color(white: 0.45))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .frame(height: 32)
        .background(Color(red: 0.09, green: 0.10, blue: 0.14))
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(Color(white: 0.12)),
            alignment: .top
        )
    }
}

struct SearchBarButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 11))
                .foregroundColor(Color(white: 0.75))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(Color(white: 0.15))
                .cornerRadius(4)
        }
        .buttonStyle(.plain)
    }
}
