import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @ObservedObject var settings = AppSettings.shared

    @State private var searchQuery = ""
    @State private var replaceQuery = ""
    @State private var lineCount = 1
    @State private var sidebarWidth: CGFloat = 240
    @State private var isResizingSidebar = false
    @State private var outline: OutlineNode? = nil

    // Referenz auf EditorWebView.Coordinator für Search-Operationen
    @State private var editorCoordinator: EditorWebView.Coordinator? = nil

    var body: some View {
        VStack(spacing: 0) {
            // Toolbar
            ToolbarView()

            // Tabs
            TabBarView()

            Divider().background(Color(white: 0.10))

            // Breadcrumbs
            BreadcrumbsView(path: breadcrumbPath)

            Divider().background(Color(white: 0.10))

            // Search Bar
            if appState.searchOpen && !appState.diffMode {
                SearchBarView(
                    searchQuery: $searchQuery,
                    replaceQuery: $replaceQuery,
                    editorCoordinator: editorCoordinator
                )
                Divider().background(Color(white: 0.10))
            }

            // Hauptbereich: Sidebar + Editor / Diff
            GeometryReader { geo in
                HStack(spacing: 0) {
                    // Sidebar
                    if appState.sidebarOpen && !appState.diffMode {
                        SidebarView(outline: outline) { line in
                            editorCoordinator?.revealLine(line)
                        }
                        .frame(width: sidebarWidth)

                        // Resizer
                        Rectangle()
                            .fill(isResizingSidebar ? Color(red: 0.49, green: 0.73, blue: 0.91) : Color(white: 0.12))
                            .frame(width: 4)
                            .onHover { hovering in
                                if hovering { NSCursor.resizeLeftRight.push() } else { NSCursor.pop() }
                            }
                            .gesture(
                                DragGesture(minimumDistance: 0)
                                    .onChanged { value in
                                        isResizingSidebar = true
                                        let newWidth = sidebarWidth + value.translation.width
                                        sidebarWidth = max(150, min(500, newWidth))
                                    }
                                    .onEnded { _ in
                                        isResizingSidebar = false
                                        UserDefaults.standard.set(Double(sidebarWidth), forKey: "klartext-sidebar-width")
                                    }
                            )
                    }

                    // Editor oder Diff
                    if appState.diffMode {
                        DiffView()
                    } else {
                        EditorWebView()
                            .onAppear {
                                if let savedWidth = UserDefaults.standard.object(forKey: "klartext-sidebar-width") as? Double {
                                    sidebarWidth = CGFloat(max(150, min(500, savedWidth)))
                                }
                            }
                    }
                }
            }

            // StatusBar
            StatusBarView(lineCount: lineCount)
        }
        .background(Color(red: 0.06, green: 0.07, blue: 0.10))
        .preferredColorScheme(.dark)
        .overlay(settingsOverlay)
        .onChange(of: appState.activeId) { _ in
            updateOutline()
        }
        .onChange(of: appState.activeTab.content) { _ in
            updateLineCount()
            updateOutline()
        }
        .onDrop(of: ["public.file-url"], isTargeted: nil) { providers in
            handleDrop(providers: providers)
            return true
        }
    }

    // MARK: - Settings Overlay

    @ViewBuilder
    private var settingsOverlay: some View {
        if appState.settingsOpen {
            ZStack {
                Color.black.opacity(0.45)
                    .ignoresSafeArea()
                    .onTapGesture { appState.settingsOpen = false }
                SettingsView()
            }
        }
    }

    // MARK: - Breadcrumbs

    private var breadcrumbPath: [String] {
        guard let root = outline else { return [] }
        if root.children.isEmpty { return [root.label] }
        return [root.label] + (root.children.first.map { [$0.label] } ?? [])
    }

    // MARK: - Helpers

    private func updateLineCount() {
        let content = appState.activeTab.content
        lineCount = content.isEmpty ? 1 : content.components(separatedBy: "\n").count
    }

    private func updateOutline() {
        let tab = appState.activeTab
        outline = OutlineService.shared.buildOutline(content: tab.content, language: tab.language)
    }

    private func handleDrop(providers: [NSItemProvider]) {
        for provider in providers {
            provider.loadItem(forTypeIdentifier: "public.file-url", options: nil) { item, _ in
                guard let data = item as? Data,
                      let url = URL(dataRepresentation: data, relativeTo: nil) else { return }
                let allowed = ["json", "xml", "xsl", "yaml", "yml", "txt"]
                guard allowed.contains(url.pathExtension.lowercased()) else { return }
                guard let content = try? String(contentsOf: url, encoding: .utf8) else { return }
                DispatchQueue.main.async {
                    let lang = DocumentLanguage.from(fileExtension: url.pathExtension)
                    let tab = TabModel(
                        title: url.lastPathComponent,
                        content: content,
                        filePath: url.path,
                        language: lang
                    )
                    appState.tabs.append(tab)
                    appState.activeId = tab.id
                }
            }
        }
    }
}
