import SwiftUI

struct SidebarView: View {
    let outline: OutlineNode?
    let onSelectLine: (Int) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Struktur")
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(white: 0.5))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)

            Divider().background(Color(white: 0.15))

            if let root = outline {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 0) {
                        OutlineNodeView(node: root, onSelectLine: onSelectLine, depth: 0)
                    }
                    .padding(.vertical, 4)
                }
            } else {
                VStack {
                    Spacer()
                    Text("Keine Struktur\n(nur JSON/XML)")
                        .font(.system(size: 11))
                        .foregroundColor(Color(white: 0.35))
                        .multilineTextAlignment(.center)
                    Spacer()
                }
                .frame(maxWidth: .infinity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(red: 0.07, green: 0.08, blue: 0.11))
    }
}

struct OutlineNodeView: View {
    let node: OutlineNode
    let onSelectLine: (Int) -> Void
    let depth: Int
    @State private var expanded = true

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 4) {
                // Einrückung
                Rectangle()
                    .foregroundColor(.clear)
                    .frame(width: CGFloat(depth * 12))

                // Toggle-Button
                if node.children.isEmpty {
                    Circle()
                        .fill(Color(white: 0.35))
                        .frame(width: 4, height: 4)
                        .padding(.horizontal, 5)
                } else {
                    Button {
                        expanded.toggle()
                    } label: {
                        Image(systemName: expanded ? "chevron.down" : "chevron.right")
                            .font(.system(size: 9))
                            .foregroundColor(Color(white: 0.4))
                            .frame(width: 14, height: 14)
                    }
                    .buttonStyle(.plain)
                }

                // Label
                Text(node.label)
                    .font(.system(size: 11))
                    .foregroundColor(Color(white: 0.75))
                    .lineLimit(1)
                    .truncationMode(.tail)

                Spacer()
            }
            .padding(.vertical, 3)
            .padding(.trailing, 8)
            .contentShape(Rectangle())
            .onTapGesture {
                onSelectLine(node.line)
            }

            if expanded && !node.children.isEmpty {
                ForEach(node.children) { child in
                    OutlineNodeView(node: child, onSelectLine: onSelectLine, depth: depth + 1)
                }
            }
        }
    }
}
