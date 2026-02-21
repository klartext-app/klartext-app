// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KlartextSwift",
    platforms: [
        .macOS(.v13)
    ],
    dependencies: [
        .package(
            url: "https://github.com/nicklockwood/SwiftFormat",
            from: "0.54.0"
        ),
        .package(
            url: "https://github.com/sparkle-project/Sparkle",
            from: "2.6.0"
        ),
    ],
    targets: [
        .executableTarget(
            name: "KlartextSwift",
            dependencies: [
                .product(name: "Sparkle", package: "Sparkle"),
            ],
            path: "KlartextSwift"
        ),
    ]
)
