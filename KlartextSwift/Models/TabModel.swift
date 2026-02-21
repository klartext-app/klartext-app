import Foundation

enum DocumentLanguage: String, Codable, CaseIterable {
    case plaintext
    case json
    case xml
    case yaml

    var displayName: String {
        switch self {
        case .plaintext: return "Plain Text"
        case .json: return "JSON"
        case .xml: return "XML"
        case .yaml: return "YAML"
        }
    }

    var fileExtension: String {
        switch self {
        case .plaintext: return "txt"
        case .json: return "json"
        case .xml: return "xml"
        case .yaml: return "yaml"
        }
    }

    static func from(fileExtension ext: String) -> DocumentLanguage {
        switch ext.lowercased() {
        case "json": return .json
        case "xml", "xsl": return .xml
        case "yaml", "yml": return .yaml
        case "txt": return .plaintext
        default: return .plaintext
        }
    }
}

struct TabModel: Identifiable, Codable, Equatable {
    var id: UUID
    var title: String
    var content: String
    var filePath: String?
    var language: DocumentLanguage
    var dirty: Bool

    init(
        id: UUID = UUID(),
        title: String = "Unbenannt",
        content: String = "",
        filePath: String? = nil,
        language: DocumentLanguage = .plaintext,
        dirty: Bool = false
    ) {
        self.id = id
        self.title = title
        self.content = content
        self.filePath = filePath
        self.language = language
        self.dirty = dirty
    }
}
