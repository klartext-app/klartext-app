import SwiftUI
import WebKit

struct EditorWebView: NSViewRepresentable {
    @EnvironmentObject var appState: AppState

    func makeCoordinator() -> Coordinator {
        Coordinator(appState: appState)
    }

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(context.coordinator, name: "contentChanged")
        config.userContentController.add(context.coordinator, name: "jsOperationResult")
        config.userContentController.add(context.coordinator, name: "lineCountChanged")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        context.coordinator.webView = webView

        // Callbacks für AppState
        appState.getEditorContent = { [weak context] in
            context?.coordinator.cachedContent ?? ""
        }
        appState.setEditorContent = { [weak context] content in
            context?.coordinator.setContent(content)
        }
        appState.onRequestJsOperation = { [weak context] operation, content in
            context?.coordinator.runJsOperation(operation, content: content)
        }

        loadEditor(webView: webView, coordinator: context.coordinator)
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {
        let tab = appState.activeTab
        context.coordinator.updateIfNeeded(
            tabId: tab.id,
            content: tab.content,
            language: tab.language,
            fontSize: appState.settings.fontSize
        )
    }

    private func loadEditor(webView: WKWebView, coordinator: Coordinator) {
        guard let htmlURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "editor") else {
            // Fallback: inline minimal editor
            let html = coordinator.inlineFallbackHTML()
            webView.loadHTMLString(html, baseURL: nil)
            return
        }
        webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
    }

    // MARK: - Coordinator

    class Coordinator: NSObject, WKScriptMessageHandler {
        weak var webView: WKWebView?
        var appState: AppState
        var cachedContent: String = ""
        private var lastTabId: UUID? = nil
        private var lastLanguage: DocumentLanguage = .plaintext
        private var lastFontSize: Int = 14
        private var editorReady = false
        private var pendingInit: (() -> Void)? = nil

        init(appState: AppState) {
            self.appState = appState
        }

        // Called after HTML + JS is loaded
        func editorDidLoad() {
            editorReady = true
            pendingInit?()
            pendingInit = nil
        }

        func updateIfNeeded(tabId: UUID, content: String, language: DocumentLanguage, fontSize: Int) {
            let tabChanged = tabId != lastTabId
            let langChanged = language != lastLanguage
            let fontChanged = fontSize != lastFontSize

            if tabChanged {
                lastTabId = tabId
                cachedContent = content
                if editorReady {
                    initEditor(content: content, language: language, fontSize: fontSize)
                } else {
                    pendingInit = { [weak self] in
                        self?.initEditor(content: content, language: language, fontSize: fontSize)
                    }
                }
            } else if langChanged {
                lastLanguage = language
                setLanguage(language)
            }
            if fontChanged {
                lastFontSize = fontSize
                setFontSize(fontSize)
            }
        }

        private func initEditor(content: String, language: DocumentLanguage, fontSize: Int) {
            lastLanguage = language
            lastFontSize = fontSize
            let escaped = jsEscape(content)
            let js = "window.KlartextEditorAPI.init('\(escaped)', '\(language.rawValue)', \(fontSize));"
            webView?.evaluateJavaScript(js, completionHandler: nil)
        }

        func setContent(_ content: String) {
            cachedContent = content
            let escaped = jsEscape(content)
            webView?.evaluateJavaScript("window.KlartextEditorAPI.setValue('\(escaped)');", completionHandler: nil)
        }

        func setLanguage(_ language: DocumentLanguage) {
            webView?.evaluateJavaScript("window.KlartextEditorAPI.setLanguage('\(language.rawValue)');", completionHandler: nil)
        }

        func setFontSize(_ size: Int) {
            webView?.evaluateJavaScript("window.KlartextEditorAPI.setFontSize(\(size));", completionHandler: nil)
        }

        func revealLine(_ line: Int) {
            webView?.evaluateJavaScript("window.KlartextEditorAPI.revealLine(\(line));", completionHandler: nil)
        }

        func runSearch(_ query: String) {
            let escaped = jsEscape(query)
            webView?.evaluateJavaScript("window.KlartextEditorAPI.search('\(escaped)');", completionHandler: nil)
        }

        func runSearchNext() {
            webView?.evaluateJavaScript("window.KlartextEditorAPI.searchNext();", completionHandler: nil)
        }

        func runSearchPrev() {
            webView?.evaluateJavaScript("window.KlartextEditorAPI.searchPrev();", completionHandler: nil)
        }

        func runReplaceAll(_ search: String, replacement: String) {
            let escSearch = jsEscape(search)
            let escReplace = jsEscape(replacement)
            webView?.evaluateJavaScript("window.KlartextEditorAPI.replaceAll('\(escSearch)', '\(escReplace)');", completionHandler: nil)
        }

        func runJsOperation(_ operation: String, content: String) {
            let escaped = jsEscape(content)
            let js = """
            (function() {
              var result = window.KlartextEditorAPI.\(operation)('\(escaped)');
              window.webkit.messageHandlers.jsOperationResult.postMessage(
                JSON.stringify({ operation: '\(operation)', result: result.result || null, error: result.error || null })
              );
            })();
            """
            webView?.evaluateJavaScript(js, completionHandler: nil)
        }

        func getLineCount(completion: @escaping (Int) -> Void) {
            webView?.evaluateJavaScript("window.KlartextEditorAPI.getLineCount();") { result, _ in
                completion(result as? Int ?? 0)
            }
        }

        // WKScriptMessageHandler
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            switch message.name {
            case "contentChanged":
                if let content = message.body as? String {
                    cachedContent = content
                    DispatchQueue.main.async { [weak self] in
                        guard let self else { return }
                        if let idx = appState.tabs.firstIndex(where: { $0.id == appState.activeId }) {
                            appState.tabs[idx].content = content
                            appState.tabs[idx].dirty = true
                        }
                    }
                }
            case "jsOperationResult":
                if let body = message.body as? String,
                   let data = body.data(using: .utf8),
                   let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let operation = obj["operation"] as? String {
                    if let error = obj["error"] as? String {
                        DispatchQueue.main.async { [weak self] in
                            self?.appState.showError(error)
                        }
                    } else if let result = obj["result"] as? String {
                        DispatchQueue.main.async { [weak self] in
                            self?.appState.handleJsOperationResult(result, operation: operation)
                        }
                    }
                }
            case "lineCountChanged":
                break
            default:
                break
            }
        }

        // Inline-Fallback wenn Bundle nicht geladen werden kann
        func inlineFallbackHTML() -> String {
            "<html><body style='background:#0f111a;color:#e6e6e6;padding:20px;font-family:monospace'>Editor wird geladen…</body></html>"
        }

        private func jsEscape(_ str: String) -> String {
            str
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\n")
                .replacingOccurrences(of: "\r", with: "\\r")
                .replacingOccurrences(of: "\u{2028}", with: "\\u2028")
                .replacingOccurrences(of: "\u{2029}", with: "\\u2029")
        }
    }
}

// Erweiterung für WKNavigationDelegate um Editor-Ready zu signalisieren
class EditorNavigationDelegate: NSObject, WKNavigationDelegate {
    var onLoad: (() -> Void)?

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Kurze Verzögerung damit JS vollständig ausgeführt wurde
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.onLoad?()
        }
    }
}
