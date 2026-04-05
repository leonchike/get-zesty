//
//  GrocerySectionView.swift
//  GetZestyApp
//
//  Created by Leon Nwankwo on 26/06/2025.
//

import SwiftUI

struct GrocerySectionView: View {
    let section: GroceryListViewModel.SectionDisplayData
    let items: [GroceryItem]
    let onToggle: (GroceryItem) -> Void
    let onEdit: (GroceryItem) -> Void
    let onDelete: (GroceryItem) -> Void

    var body: some View {
        Section {
            ForEach(items) { item in
                SwipeableGroceryRow(
                    item: item,
                    onToggle: { onToggle(item) },
                    onEdit: { onEdit(item) },
                    onDelete: { onDelete(item) }
                )
                .listRowInsets(EdgeInsets(top: 0, leading: AppSpacing.md, bottom: 0, trailing: AppSpacing.md))
                .listRowSeparator(.visible)
                .listRowBackground(Color.backgroundPrimary)
            }
        } header: {
            CustomSectionHeader(
                title: section.name,
                emoji: section.emoji,
                itemCount: items.count
            )
            .listRowInsets(EdgeInsets())
        }
    }
}
