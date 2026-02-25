# Homebrew Cask für Klartext (macOS)
# Dieses Cask gehört in ein Tap-Repo (homebrew-klartext).
cask "klartext" do
  version "0.2.8"

  sha256 "10ed80c7b94055e452dda0dcaeba6daf0f10eeb1e463dab058575a643cc54844"

  url "https://github.com/klartext-app/klartext-app/releases/download/v#{version}/Klartext_#{version}_aarch64.dmg"
  name "Klartext"
  desc "Moderner Texteditor mit JSON/XML/YAML-Formatierung"
  homepage "https://github.com/klartext-app/klartext-app"

  app "Klartext.app"

  postflight do
    system_command "/usr/bin/xattr",
      args: ["-r", "-d", "com.apple.quarantine", "#{appdir}/Klartext.app"],
      sudo: false
  end

  zap trash: [
    "~/Library/Application Support/com.recorz.klartext",
    "~/Library/Preferences/com.recorz.klartext.plist",
  ]
end
