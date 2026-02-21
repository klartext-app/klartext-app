import Foundation
import Combine

enum UiLanguage: String, CaseIterable {
    case de = "de"
    case en = "en"

    var displayName: String {
        switch self {
        case .de: return "Deutsch"
        case .en: return "English"
        }
    }
}

class AppSettings: ObservableObject {
    static let shared = AppSettings()

    @Published var uiLanguage: UiLanguage {
        didSet { UserDefaults.standard.set(uiLanguage.rawValue, forKey: "klartext-language") }
    }
    @Published var favoriteJson: Bool {
        didSet { UserDefaults.standard.set(favoriteJson, forKey: "klartext-fav-json") }
    }
    @Published var favoriteXml: Bool {
        didSet { UserDefaults.standard.set(favoriteXml, forKey: "klartext-fav-xml") }
    }
    @Published var favoriteYaml: Bool {
        didSet { UserDefaults.standard.set(favoriteYaml, forKey: "klartext-fav-yaml") }
    }
    @Published var autoSave: Bool {
        didSet { UserDefaults.standard.set(autoSave, forKey: "klartext-auto-save") }
    }
    @Published var fontSize: Int {
        didSet { UserDefaults.standard.set(fontSize, forKey: "klartext-font-size") }
    }

    init() {
        let ud = UserDefaults.standard
        let langRaw = ud.string(forKey: "klartext-language") ?? "de"
        uiLanguage = UiLanguage(rawValue: langRaw) ?? .de
        favoriteJson = ud.object(forKey: "klartext-fav-json") as? Bool ?? true
        favoriteXml = ud.object(forKey: "klartext-fav-xml") as? Bool ?? true
        favoriteYaml = ud.object(forKey: "klartext-fav-yaml") as? Bool ?? false
        autoSave = ud.bool(forKey: "klartext-auto-save")
        let fs = ud.integer(forKey: "klartext-font-size")
        fontSize = fs == 0 ? 14 : max(10, min(28, fs))
    }

    func label(_ de: String, _ en: String) -> String {
        uiLanguage == .de ? de : en
    }
}
