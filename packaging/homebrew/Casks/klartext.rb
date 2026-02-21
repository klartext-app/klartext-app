# Homebrew Cask für Klartext (macOS)
# Dieses Cask gehört in ein Tap-Repo (homebrew-klartext).
cask "klartext" do
  version "0.2.4"

  sha256 "0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5"

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
