import Foundation

enum FormatterError: Error, LocalizedError {
    case unrecognizedFormat
    case parseError(String)

    var errorDescription: String? {
        switch self {
        case .unrecognizedFormat:
            return "Das Zielformat wurde nicht erkannt."
        case .parseError(let msg):
            return msg
        }
    }
}

class FormatterService {
    static let shared = FormatterService()

    // MARK: - JSON

    func formatJson(_ text: String) throws -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return text }
        guard trimmed.hasPrefix("{") || trimmed.hasPrefix("[") else {
            throw FormatterError.unrecognizedFormat
        }
        guard let data = trimmed.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data),
              let formatted = try? JSONSerialization.data(withJSONObject: obj, options: [.prettyPrinted, .sortedKeys]),
              let result = String(data: formatted, encoding: .utf8) else {
            throw FormatterError.parseError("Ungültiges JSON")
        }
        return result
    }

    func minifyJson(_ text: String) throws -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return text }
        guard trimmed.hasPrefix("{") || trimmed.hasPrefix("[") else {
            throw FormatterError.unrecognizedFormat
        }
        guard let data = trimmed.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data),
              let minified = try? JSONSerialization.data(withJSONObject: obj, options: []),
              let result = String(data: minified, encoding: .utf8) else {
            throw FormatterError.parseError("Ungültiges JSON")
        }
        return result
    }

    // MARK: - XML

    func formatXml(_ text: String) throws -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return text }
        guard trimmed.hasPrefix("<") else { throw FormatterError.unrecognizedFormat }
        guard let data = trimmed.data(using: .utf8) else {
            throw FormatterError.parseError("XML-Encoding-Fehler")
        }
        do {
            let xmlDoc = try XMLDocument(data: data, options: .nodePreserveCDATA)
            let result = xmlDoc.xmlString(options: [.nodePrettyPrint])
            return result
        } catch {
            throw FormatterError.parseError("Ungültiges XML: \(error.localizedDescription)")
        }
    }

    func minifyXml(_ text: String) throws -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return text }
        guard trimmed.hasPrefix("<") else { throw FormatterError.unrecognizedFormat }
        guard let data = trimmed.data(using: .utf8) else {
            throw FormatterError.parseError("XML-Encoding-Fehler")
        }
        do {
            let xmlDoc = try XMLDocument(data: data, options: [])
            let result = xmlDoc.xmlString(options: [])
            return result
        } catch {
            throw FormatterError.parseError("Ungültiges XML: \(error.localizedDescription)")
        }
    }

    // MARK: - YAML (via JavaScript bridge - handled in AppState)
    // Swift hat kein natives YAML - wird via WKWebView JS-Bridge formatiert

    // MARK: - Konvertierungen

    func jsonToXml(_ text: String) throws -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return text }
        guard let data = trimmed.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) else {
            throw FormatterError.parseError("Ungültiges JSON")
        }
        let xmlDoc = XMLDocument()
        let root = XMLElement(name: "root")
        xmlDoc.addChild(root)
        try buildXmlFromJson(obj, parent: root)
        return xmlDoc.xmlString(options: [.nodePrettyPrint])
    }

    private func buildXmlFromJson(_ value: Any, parent: XMLElement) throws {
        if let dict = value as? [String: Any] {
            for (key, val) in dict {
                let safeName = key.replacingOccurrences(of: " ", with: "_")
                let child = XMLElement(name: safeName)
                parent.addChild(child)
                try buildXmlFromJson(val, parent: child)
            }
        } else if let array = value as? [Any] {
            for item in array {
                let child = XMLElement(name: "item")
                parent.addChild(child)
                try buildXmlFromJson(item, parent: child)
            }
        } else if let str = value as? String {
            parent.stringValue = str
        } else if let num = value as? NSNumber {
            parent.stringValue = num.stringValue
        } else if value is NSNull {
            parent.stringValue = "null"
        }
    }

    func xmlToJson(_ text: String) throws -> String {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return text }
        guard trimmed.hasPrefix("<") else { throw FormatterError.unrecognizedFormat }
        guard let data = trimmed.data(using: .utf8) else {
            throw FormatterError.parseError("XML-Encoding-Fehler")
        }
        do {
            let xmlDoc = try XMLDocument(data: data, options: [])
            guard let root = xmlDoc.rootElement() else {
                throw FormatterError.parseError("Kein XML-Root-Element")
            }
            let dict = xmlNodeToDict(root)
            let jsonData = try JSONSerialization.data(withJSONObject: dict, options: [.prettyPrinted])
            return String(data: jsonData, encoding: .utf8) ?? ""
        } catch let e as FormatterError {
            throw e
        } catch {
            throw FormatterError.parseError("XML→JSON Fehler: \(error.localizedDescription)")
        }
    }

    private func xmlNodeToDict(_ element: XMLElement) -> Any {
        if element.childCount == 0 {
            return element.stringValue ?? ""
        }
        let children = element.children ?? []
        let elementChildren = children.compactMap { $0 as? XMLElement }
        if elementChildren.isEmpty {
            return element.stringValue ?? ""
        }
        var dict: [String: Any] = [:]
        for child in elementChildren {
            let childValue = xmlNodeToDict(child)
            let name = child.name ?? "node"
            if let existing = dict[name] {
                if var arr = existing as? [Any] {
                    arr.append(childValue)
                    dict[name] = arr
                } else {
                    dict[name] = [existing, childValue]
                }
            } else {
                dict[name] = childValue
            }
        }
        return dict
    }

    // MARK: - Auto-Detect Minify

    func minify(_ text: String) throws -> (result: String, language: DocumentLanguage) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return (text, .plaintext) }
        if trimmed.hasPrefix("{") || trimmed.hasPrefix("[") {
            return (try minifyJson(text), .json)
        } else if trimmed.hasPrefix("<") {
            return (try minifyXml(text), .xml)
        }
        throw FormatterError.unrecognizedFormat
    }
}
