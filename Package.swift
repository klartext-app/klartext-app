// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KlartextSwift",
    platforms: [
        .macOS(.v13)
    ],
    targets: [
        .executableTarget(
            name: "KlartextSwift",
            path: "KlartextSwift",
            exclude: ["Info.plist"],
            resources: [
                .copy("Resources/editor"),
                .copy("Resources/AppIcon.icns")
            ]
        ),
    ]
)
