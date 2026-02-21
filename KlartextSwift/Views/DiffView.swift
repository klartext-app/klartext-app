import SwiftUI
import WebKit

struct DiffView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: 0) {
            // Diff-Toolbar
            HStack {
                Text(AppSettings.shared.label("Vergleichsmodus", "Compare mode"))
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Color(white: 0.6))
                Spacer()
                Button {
                    appState.diffMode = false
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 13))
                        .foregroundColor(Color(white: 0.6))
                }
                .buttonStyle(.plain)
                .help(AppSettings.shared.label("Vergleich schließen", "Close compare"))
            }
            .padding(.horizontal, 12)
            .frame(height: 36)
            .background(Color(red: 0.10, green: 0.11, blue: 0.15))

            Divider().background(Color(white: 0.12))

            DiffWebView(
                original: appState.diffOriginalContent,
                modified: appState.activeTab.content,
                language: appState.activeTab.language
            )
        }
    }
}

struct DiffWebView: NSViewRepresentable {
    let original: String
    let modified: String
    let language: DocumentLanguage

    func makeNSView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.setValue(false, forKey: "drawsBackground")
        loadDiff(in: webView)
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    private func loadDiff(in webView: WKWebView) {
        let escaped_orig = jsEscape(original)
        let escaped_mod = jsEscape(modified)
        let lang = language.rawValue

        let html = """
        <!DOCTYPE html>
        <html><head>
        <meta charset="UTF-8"/>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { height: 100%; background: #0f111a; color: #e6e6e6; font-family: 'Cascadia Code', 'Fira Code', Menlo, monospace; font-size: 13px; }
          .diff-container { display: flex; height: 100vh; }
          .diff-panel { flex: 1; overflow: auto; padding: 12px; border-right: 1px solid #1e2030; white-space: pre; }
          .diff-panel:last-child { border-right: none; }
          .diff-panel h3 { font-size: 11px; color: #555; margin-bottom: 8px; font-family: system-ui; }
          .diff-added { background: #1e3a2a; display: block; }
          .diff-removed { background: #3a1e1e; display: block; }
        </style>
        </head>
        <body>
        <div class="diff-container">
          <div class="diff-panel">
            <h3>Original</h3>
            <code id="orig"></code>
          </div>
          <div class="diff-panel">
            <h3>Aktuell</h3>
            <code id="mod"></code>
          </div>
        </div>
        <script>
          const orig = '\(escaped_orig)';
          const mod = '\(escaped_mod)';
          document.getElementById('orig').textContent = orig;
          document.getElementById('mod').textContent = mod;
        </script>
        </body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    private func jsEscape(_ str: String) -> String {
        str
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
    }
}
