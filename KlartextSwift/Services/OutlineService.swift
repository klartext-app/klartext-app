import Foundation

struct OutlineNode: Identifiable {
    let id: UUID
    let label: String
    let line: Int
    var children: [OutlineNode]

    init(label: String, line: Int, children: [OutlineNode] = []) {
        self.id = UUID()
        self.label = label
        self.line = line
        self.children = children
    }
}

class OutlineService {
    static let shared = OutlineService()

    func buildOutline(content: String, language: DocumentLanguage) -> OutlineNode? {
        switch language {
        case .json:
            return buildJsonOutline(content: content)
        case .xml:
            return buildXmlOutline(content: content)
        default:
            return nil
        }
    }

    // MARK: - JSON Outline

    private func buildJsonOutline(content: String) -> OutlineNode? {
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              let data = trimmed.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) else {
            return nil
        }
        let lines = content.components(separatedBy: "\n")
        return parseJsonValue(obj, label: "root", lines: lines, depth: 0)
    }

    private func parseJsonValue(_ value: Any, label: String, lines: [String], depth: Int) -> OutlineNode? {
        guard depth < 8 else { return nil }
        if let dict = value as? [String: Any] {
            var node = OutlineNode(label: label, line: 1)
            for (key, val) in dict.sorted(by: { $0.key < $1.key }) {
                if let child = parseJsonValue(val, label: key, lines: lines, depth: depth + 1) {
                    node.children.append(child)
                }
            }
            return node
        } else if let arr = value as? [Any] {
            var node = OutlineNode(label: "\(label) [\(arr.count)]", line: 1)
            for (i, item) in arr.prefix(50).enumerated() {
                if let child = parseJsonValue(item, label: "[\(i)]", lines: lines, depth: depth + 1) {
                    node.children.append(child)
                }
            }
            return node
        } else {
            let valStr: String
            if let s = value as? String {
                valStr = s.count > 30 ? String(s.prefix(30)) + "…" : s
            } else if let n = value as? NSNumber {
                valStr = n.stringValue
            } else if value is NSNull {
                valStr = "null"
            } else {
                valStr = ""
            }
            return OutlineNode(label: "\(label): \(valStr)", line: 1)
        }
    }

    // MARK: - XML Outline

    private func buildXmlOutline(content: String) -> OutlineNode? {
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              trimmed.hasPrefix("<"),
              let data = trimmed.data(using: .utf8),
              let xmlDoc = try? XMLDocument(data: data, options: []),
              let root = xmlDoc.rootElement() else {
            return nil
        }
        return parseXmlElement(root, depth: 0)
    }

    private func parseXmlElement(_ element: XMLElement, depth: Int) -> OutlineNode? {
        guard depth < 8 else { return nil }
        let name = element.name ?? "element"
        var node = OutlineNode(label: name, line: 1)
        let children = (element.children ?? []).compactMap { $0 as? XMLElement }
        for child in children.prefix(100) {
            if let childNode = parseXmlElement(child, depth: depth + 1) {
                node.children.append(childNode)
            }
        }
        return node
    }
}
