# Homebrew Cask für Klartext (macOS)
# Siehe docs/INSTALL.md – dieses Cask gehört in ein Tap-Repo (homebrew-klartext).
cask "klartext" do
  arch arm: "aarch64", intel: "x86_64"
  version "0.1.0"

  sha256 arm:   "REPLACE_WITH_ARM64_DMG_SHA256",
         intel: "REPLACE_WITH_X86_64_DMG_SHA256"

  url "https://github.com/klartext-app/klartext-app/releases/download/v#{version}/Klartext_#{version}_#{arch}.dmg"
  name "Klartext"
  desc "Moderner Texteditor mit JSON/XML/YAML-Formatierung"
  homepage "https://github.com/klartext-app/klartext-app"

  livecheck do
    url :url
    strategy :github_latest
    regex(%r{href=.*?/tag/v?(\d+(?:\.\d+)+)["' >]}i)
  end

  app "Klartext.app"

  zap trash: []
end
