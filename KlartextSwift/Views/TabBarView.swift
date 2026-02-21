import SwiftUI

struct TabBarView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                ForEach(appState.tabs) { tab in
                    TabItemView(tab: tab)
                }
            }
        }
        .frame(height: 36)
        .background(Color(red: 0.08, green: 0.09, blue: 0.12))
    }
}

struct TabItemView: View {
    @EnvironmentObject var appState: AppState
    let tab: TabModel

    @State private var isRenaming = false
    @State private var renameText = ""
    @State private var isRenamingFile = false

    var isActive: Bool { tab.id == appState.activeId }

    var body: some View {
        HStack(spacing: 4) {
            if isRenaming {
                TextField("", text: $renameText)
                    .font(.system(size: 12))
                    .foregroundColor(.white)
                    .frame(maxWidth: 140)
                    .textFieldStyle(.plain)
                    .onSubmit { commitRename() }
                    .onExitCommand { isRenaming = false }
            } else {
                Text((tab.dirty ? "• " : "") + tab.title)
                    .font(.system(size: 12))
                    .foregroundColor(isActive ? .white : Color(white: 0.6))
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .frame(maxWidth: 160)
            }

            Button {
                appState.closeTab(tab.id)
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(Color(white: 0.5))
                    .frame(width: 14, height: 14)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 10)
        .frame(height: 36)
        .background(
            isActive
                ? Color(red: 0.12, green: 0.14, blue: 0.18)
                : Color.clear
        )
        .overlay(
            isActive
                ? Rectangle()
                    .frame(height: 2)
                    .foregroundColor(Color(red: 0.49, green: 0.73, blue: 0.91))
                    .frame(maxHeight: .infinity, alignment: .top)
                : nil
        )
        .onTapGesture {
            appState.activeId = tab.id
        }
        .contextMenu {
            Button {
                startRenameTab()
            } label: {
                Label("Tab umbenennen", systemImage: "pencil")
            }

            if tab.filePath != nil {
                Button {
                    startRenameFile()
                } label: {
                    Label("Datei umbenennen", systemImage: "doc.badge.pencil")
                }
            }

            Divider()

            Button(role: .destructive) {
                appState.closeTab(tab.id)
            } label: {
                Label("Tab schließen", systemImage: "xmark")
            }
        }
        .alert("Tab umbenennen", isPresented: $isRenaming) {
            TextField("Name", text: $renameText)
            Button("Umbenennen") { commitRename() }
            Button("Abbrechen", role: .cancel) {}
        }
        .alert("Datei umbenennen", isPresented: $isRenamingFile) {
            TextField("Dateiname", text: $renameText)
            Button("Umbenennen") { commitFileRename() }
            Button("Abbrechen", role: .cancel) {}
        }
    }

    private func startRenameTab() {
        renameText = tab.title
        isRenaming = true
    }

    private func startRenameFile() {
        renameText = tab.filePath.map { URL(fileURLWithPath: $0).lastPathComponent } ?? tab.title
        isRenamingFile = true
    }

    private func commitRename() {
        let newName = renameText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !newName.isEmpty else { return }
        guard let idx = appState.tabs.firstIndex(where: { $0.id == tab.id }) else { return }
        appState.tabs[idx].title = newName
        isRenaming = false
    }

    private func commitFileRename() {
        let newName = renameText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !newName.isEmpty,
              let oldPath = tab.filePath else { return }

        let oldURL = URL(fileURLWithPath: oldPath)
        let newURL = oldURL.deletingLastPathComponent().appendingPathComponent(newName)

        do {
            try FileManager.default.moveItem(at: oldURL, to: newURL)
            guard let idx = appState.tabs.firstIndex(where: { $0.id == tab.id }) else { return }
            appState.tabs[idx].filePath = newURL.path
            appState.tabs[idx].title = newName
        } catch {
            appState.showError("Umbenennen fehlgeschlagen: \(error.localizedDescription)")
        }
        isRenamingFile = false
    }
}
