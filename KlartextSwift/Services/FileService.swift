import AppKit
import Foundation

enum FileServiceError: Error, LocalizedError {
    case cancelled
    case readFailed(String)
    case writeFailed(String)

    var errorDescription: String? {
        switch self {
        case .cancelled: return "Abgebrochen"
        case .readFailed(let msg): return "Lesefehler: \(msg)"
        case .writeFailed(let msg): return "Schreibfehler: \(msg)"
        }
    }
}

struct OpenResult {
    let path: String
    let content: String
    let language: DocumentLanguage
}

class FileService {
    static let shared = FileService()

    private let allowedExtensions = ["json", "xml", "xsl", "yaml", "yml", "txt"]

    func openFile() async throws -> OpenResult {
        return try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.main.async {
                let panel = NSOpenPanel()
                panel.canChooseFiles = true
                panel.canChooseDirectories = false
                panel.allowsMultipleSelection = false
                panel.allowedContentTypes = []
                panel.title = "Datei öffnen"

                guard panel.runModal() == .OK, let url = panel.url else {
                    continuation.resume(throwing: FileServiceError.cancelled)
                    return
                }

                do {
                    let content = try String(contentsOf: url, encoding: .utf8)
                    let ext = url.pathExtension
                    let language = DocumentLanguage.from(fileExtension: ext)
                    continuation.resume(returning: OpenResult(
                        path: url.path,
                        content: content,
                        language: language
                    ))
                } catch {
                    continuation.resume(throwing: FileServiceError.readFailed(error.localizedDescription))
                }
            }
        }
    }

    func saveFile(path: String?, content: String, suggestedName: String? = nil, language: DocumentLanguage = .plaintext) async throws -> String {
        if let path = path {
            return try await saveToPath(path: path, content: content)
        } else {
            return try await saveAsDialog(content: content, suggestedName: suggestedName, language: language)
        }
    }

    private func saveToPath(path: String, content: String) async throws -> String {
        return try await withCheckedThrowingContinuation { continuation in
            do {
                try content.write(toFile: path, atomically: true, encoding: .utf8)
                continuation.resume(returning: path)
            } catch {
                continuation.resume(throwing: FileServiceError.writeFailed(error.localizedDescription))
            }
        }
    }

    private func saveAsDialog(content: String, suggestedName: String? = nil, language: DocumentLanguage = .plaintext) async throws -> String {
        return try await withCheckedThrowingContinuation { continuation in
            DispatchQueue.main.async {
                let panel = NSSavePanel()
                panel.title = "Datei speichern"
                panel.nameFieldStringValue = self.buildFileName(suggestedName: suggestedName, language: language)

                guard panel.runModal() == .OK, let url = panel.url else {
                    continuation.resume(throwing: FileServiceError.cancelled)
                    return
                }

                do {
                    try content.write(to: url, atomically: true, encoding: .utf8)
                    continuation.resume(returning: url.path)
                } catch {
                    continuation.resume(throwing: FileServiceError.writeFailed(error.localizedDescription))
                }
            }
        }
    }

    private func buildFileName(suggestedName: String?, language: DocumentLanguage) -> String {
        let ext = language.fileExtension
        var base = suggestedName ?? "Unbenannt"

        // Vorhandene Endung entfernen falls vorhanden
        let knownExtensions = ["json", "xml", "xsl", "yaml", "yml", "txt"]
        let currentExt = URL(fileURLWithPath: base).pathExtension.lowercased()
        if knownExtensions.contains(currentExt) {
            base = URL(fileURLWithPath: base).deletingPathExtension().lastPathComponent
        }

        return "\(base).\(ext)"
    }

    func fileName(from path: String) -> String {
        URL(fileURLWithPath: path).lastPathComponent
    }
}
