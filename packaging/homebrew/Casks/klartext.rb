# Homebrew Cask für Klartext (macOS)
# Siehe docs/INSTALL.md – dieses Cask gehört in ein Tap-Repo (homebrew-klartext).
cask "klartext" do
  arch arm: "aarch64", intel: "x86_64"
  version "0.1.6"

  sha256 arm:   "28d60d430a26c03d74cd9e9b73982b9be4829bac4ad7a2e7b94efb038c756660",
         intel: "REPLACE_WITH_X86_64_DMG_SHA256"

  url "https://github.com/klartext-app/klartext-app/releases/download/v#{version}/Klartext_#{version}_#{arch}.dmg"
  name "Klartext"
  desc "Moderner Texteditor mit JSON/XML/YAML-Formatierung"
  homepage "https://github.com/klartext-app/klartext-app"

  app "Klartext.app"

  zap trash: []
end
