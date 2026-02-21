# Homebrew Cask für Klartext (macOS)
# Dieses Cask gehört in ein Tap-Repo (homebrew-klartext).
cask "klartext" do
  version "0.2.5"

  sha256 "c103100294f2274eb01556673043bc60f5004e2ca72fa75da838f68b8317543f"

  url "https://github.com/klartext-app/klartext-app/releases/download/v#{version}/Klartext_#{version}_aarch64.dmg"
  name "Klartext"
  desc "Moderner Texteditor mit JSON/XML/YAML-Formatierung"
  homepage "https://github.com/klartext-app/klartext-app"

  app "Klartext.app"

  zap trash: [
    "~/Library/Application Support/com.recorz.klartext",
    "~/Library/Preferences/com.recorz.klartext.plist",
  ]
end
