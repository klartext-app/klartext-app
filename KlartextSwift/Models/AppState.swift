import Foundation
import Combine
import AppKit

@MainActor
class AppState: ObservableObject {
    @Published var tabs: [TabModel] = []
    @Published var activeId: UUID = UUID()
    @Published var error: String? = nil
    @Published var sidebarOpen: Bool = false
    @Published var settingsOpen: Bool = false
    @Published var searchOpen: Bool = false
    @Published var diffMode: Bool = false
    @Published var diffOriginalContent: String = ""

    let settings = AppSettings.shared
    @Published var fontSize: Int = AppSettings.shared.fontSize

    private var autoSaveTimer: Timer? = nil
    private var errorTimer: Timer? = nil
    private var cancellables = Set<AnyCancellable>()

    // Callback: Editor-Inhalt abrufen / setzen (wird von EditorWebView gesetzt)
    var getEditorContent: (() -> String)? = nil
    var setEditorContent: ((String) -> Void)? = nil

    private let tabsKey = "klartext-tabs"
    private let activeIdKey = "klartext-active-id"

    init() {
        loadPersistedTabs()
        if tabs.isEmpty {
            addTab()
        }

        $tabs
            .debounce(for: .milliseconds(500), scheduler: RunLoop.main)
            .sink { [weak self] _ in self?.persistTabs() }
            .store(in: &cancellables)

        settings.$fontSize
            .sink { [weak self] size in self?.fontSize = size }
            .store(in: &cancellables)
    }

    // MARK: - Computed

    var activeTab: TabModel {
        get { tabs.first(where: { $0.id == activeId }) ?? tabs[0] }
        set {
            if let idx = tabs.firstIndex(where: { $0.id == activeId }) {
                tabs[idx] = newValue
            }
        }
    }

    // MARK: - Tab Management

    func addTab() {
        let tab = TabModel()
        tabs.append(tab)
        activeId = tab.id
        error = nil
    }

    func closeTab(_ id: UUID) {
        guard let idx = tabs.firstIndex(where: { $0.id == id }) else { return }
        tabs.remove(at: idx)
        if tabs.isEmpty { addTab(); return }
        if activeId == id {
            let newIdx = max(0, idx - 1)
            activeId = tabs[newIdx].id
        }
        error = nil
    }

    func setActiveContent(_ content: String) {
        guard let idx = tabs.firstIndex(where: { $0.id == activeId }) else { return }
        tabs[idx].content = content
        tabs[idx].dirty = true
        scheduleAutoSave()
    }

    func updateActiveLanguage(_ language: DocumentLanguage) {
        guard let idx = tabs.firstIndex(where: { $0.id == activeId }) else { return }
        tabs[idx].language = language
    }

    // MARK: - File Operations

    func openFile() async {
        do {
            let result = try await FileService.shared.openFile()
            let tab = TabModel(
                title: FileService.shared.fileName(from: result.path),
                content: result.content,
                filePath: result.path,
                language: result.language,
                dirty: false
            )
            tabs.append(tab)
            activeId = tab.id
            error = nil
        } catch FileServiceError.cancelled {
            // Nutzer hat abgebrochen
        } catch {
            showError(error.localizedDescription)
        }
    }

    func saveActiveTab() async {
        let content = getEditorContent?() ?? activeTab.content
        let tab = activeTab
        do {
            let path = try await FileService.shared.saveFile(
                path: tab.filePath,
                content: content,
                suggestedName: tab.title,
                language: tab.language
            )
            guard let idx = tabs.firstIndex(where: { $0.id == activeId }) else { return }
            tabs[idx].filePath = path
            tabs[idx].title = FileService.shared.fileName(from: path)
            tabs[idx].content = content
            tabs[idx].dirty = false
            error = nil
        } catch FileServiceError.cancelled {
            // Nutzer hat abgebrochen
        } catch {
            showError(error.localizedDescription)
        }
    }

    // MARK: - Formatting

    func formatJson() {
        let content = getEditorContent?() ?? activeTab.content
        // Tatsächliche Sprache des Contents erkennen, nicht nur Tab-Sprache
        let detectedLang = DocumentLanguage.detect(from: content)
        let sourceLang = detectedLang != .plaintext ? detectedLang : activeTab.language
        do {
            let result: String
            switch sourceLang {
            case .yaml:
                requestYamlToJson(content)
                return
            case .xml:
                result = try FormatterService.shared.xmlToJson(content)
            default:
                result = try FormatterService.shared.formatJson(content)
            }
            applyFormattedContent(result, language: .json)
        } catch {
            showError(error.localizedDescription)
        }
    }

    func formatXml() {
        let content = getEditorContent?() ?? activeTab.content
        let detectedLang = DocumentLanguage.detect(from: content)
        let sourceLang = detectedLang != .plaintext ? detectedLang : activeTab.language
        do {
            let result: String
            switch sourceLang {
            case .json:
                result = try FormatterService.shared.jsonToXml(content)
            case .yaml:
                // YAML→JSON→XML wäre komplex, direkt als XML versuchen
                result = try FormatterService.shared.formatXml(content)
            default:
                result = try FormatterService.shared.formatXml(content)
            }
            applyFormattedContent(result, language: .xml)
        } catch {
            showError(error.localizedDescription)
        }
    }

    func formatYaml() {
        let content = getEditorContent?() ?? activeTab.content
        let detectedLang = DocumentLanguage.detect(from: content)
        let sourceLang = detectedLang != .plaintext ? detectedLang : activeTab.language
        if sourceLang == .json {
            requestJsonToYaml(content)
        } else {
            requestYamlFormat(content)
        }
    }

    func minify() {
        let content = getEditorContent?() ?? activeTab.content
        if activeTab.language == .yaml {
            requestYamlMinify(content)
            return
        }
        do {
            let (result, lang) = try FormatterService.shared.minify(content)
            applyFormattedContent(result, language: lang)
        } catch {
            showError(error.localizedDescription)
        }
    }

    func clearContent() {
        applyFormattedContent("", language: .plaintext)
        tabs[tabs.firstIndex(where: { $0.id == activeId })!].dirty = false
        error = nil
    }

    func startDiff() {
        diffOriginalContent = getEditorContent?() ?? activeTab.content
        diffMode = true
    }

    var setEditorContentAndLanguage: ((String, DocumentLanguage) -> Void)? = nil

    func applyFormattedContent(_ content: String, language: DocumentLanguage) {
        guard let idx = tabs.firstIndex(where: { $0.id == activeId }) else { return }
        tabs[idx].content = content
        tabs[idx].language = language
        tabs[idx].dirty = true
        setEditorContentAndLanguage?(content, language)
    }

    // MARK: - JS-Bridge Requests (YAML via WebView)

    var onRequestJsOperation: ((String, String) -> Void)? = nil

    func requestJsonToYaml(_ content: String) {
        onRequestJsOperation?("jsonToYaml", content)
    }

    func requestYamlToJson(_ content: String) {
        onRequestJsOperation?("yamlToJson", content)
    }

    func requestYamlFormat(_ content: String) {
        onRequestJsOperation?("formatYaml", content)
    }

    func requestYamlMinify(_ content: String) {
        onRequestJsOperation?("minifyYaml", content)
    }

    func handleJsOperationResult(_ result: String, operation: String) {
        switch operation {
        case "jsonToYaml": applyFormattedContent(result, language: .yaml)
        case "yamlToJson": applyFormattedContent(result, language: .json)
        case "formatYaml": applyFormattedContent(result, language: .yaml)
        case "minifyYaml": applyFormattedContent(result, language: .yaml)
        default: break
        }
    }

    // MARK: - Error

    func showError(_ message: String) {
        error = message
        errorTimer?.invalidate()
        errorTimer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: false) { [weak self] _ in
            DispatchQueue.main.async { self?.error = nil }
        }
    }

    // MARK: - Auto-Save

    private func scheduleAutoSave() {
        guard settings.autoSave else { return }
        guard activeTab.filePath != nil else { return }
        autoSaveTimer?.invalidate()
        autoSaveTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: false) { [weak self] _ in
            guard let self else { return }
            Task { @MainActor in await self.saveActiveTab() }
        }
    }

    // MARK: - Persistence

    private func loadPersistedTabs() {
        guard let data = UserDefaults.standard.data(forKey: tabsKey),
              let decoded = try? JSONDecoder().decode([TabModel].self, from: data) else {
            return
        }
        tabs = decoded.map { var t = $0; t.dirty = false; return t }
        if let idString = UserDefaults.standard.string(forKey: activeIdKey),
           let uuid = UUID(uuidString: idString),
           tabs.contains(where: { $0.id == uuid }) {
            activeId = uuid
        } else if let first = tabs.first {
            activeId = first.id
        }
    }

    private func persistTabs() {
        if let data = try? JSONEncoder().encode(tabs) {
            UserDefaults.standard.set(data, forKey: tabsKey)
        }
        UserDefaults.standard.set(activeId.uuidString, forKey: activeIdKey)
    }
}
