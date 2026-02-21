// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KlartextSwift",
    platforms: [
        .macOS(.v13)
    ],
    dependencies: [
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.0.0")
    ],
    targets: [
        .executableTarget(
            name: "KlartextSwift",
            dependencies: [
                .product(name: "Sparkle", package: "Sparkle")
            ],
            path: "KlartextSwift",
            exclude: ["Info.plist"],
            resources: [
                .copy("Resources/editor"),
                .copy("Resources/AppIcon.icns")
            ]
        ),
    ]
)
