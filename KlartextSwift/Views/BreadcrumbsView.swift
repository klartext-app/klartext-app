import SwiftUI

struct BreadcrumbsView: View {
    let path: [String]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                if path.isEmpty {
                    Text("—")
                        .font(.system(size: 11))
                        .foregroundColor(Color(white: 0.35))
                } else {
                    ForEach(Array(path.enumerated()), id: \.offset) { i, segment in
                        if i > 0 {
                            Text("›")
                                .font(.system(size: 11))
                                .foregroundColor(Color(white: 0.3))
                        }
                        Text(segment)
                            .font(.system(size: 11))
                            .foregroundColor(Color(white: 0.55))
                    }
                }
                Spacer()
            }
            .padding(.horizontal, 12)
        }
        .frame(height: 24)
        .background(Color(red: 0.07, green: 0.08, blue: 0.11))
    }
}
