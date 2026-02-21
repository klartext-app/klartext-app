import SwiftUI

struct TabBarView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                ForEach(appState.tabs) { tab in
                    TabItemView(tab: tab)
                }
            }
        }
        .frame(height: 36)
        .background(Color(red: 0.08, green: 0.09, blue: 0.12))
    }
}

struct TabItemView: View {
    @EnvironmentObject var appState: AppState
    let tab: TabModel

    var isActive: Bool { tab.id == appState.activeId }

    var body: some View {
        HStack(spacing: 4) {
            Text((tab.dirty ? "• " : "") + tab.title)
                .font(.system(size: 12))
                .foregroundColor(isActive ? .white : Color(white: 0.6))
                .lineLimit(1)
                .truncationMode(.middle)
                .frame(maxWidth: 160)

            Button {
                appState.closeTab(tab.id)
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(Color(white: 0.5))
                    .frame(width: 14, height: 14)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 10)
        .frame(height: 36)
        .background(
            isActive
                ? Color(red: 0.12, green: 0.14, blue: 0.18)
                : Color.clear
        )
        .overlay(
            isActive
                ? Rectangle()
                    .frame(height: 2)
                    .foregroundColor(Color(red: 0.49, green: 0.73, blue: 0.91))
                    .frame(maxHeight: .infinity, alignment: .top)
                : nil
        )
        .onTapGesture {
            appState.activeId = tab.id
        }
    }
}
