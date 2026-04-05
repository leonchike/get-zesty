import React from "react";
import useUIStore from "@/stores/global-ui-store";
import SheetModalBase from "@/components/sheet-modal-base";
import FiltersContent from "@/features/recipes-index/components/filters-content";
import ImageSheet from "@/features/create-edit-recipe/components/image-upload/image-sheet";
import SettingsContent from "@/features/settings/components/content";

interface GlobalUIProviderProps {
  children: React.ReactNode;
}

export function GlobalUIProvider({ children }: GlobalUIProviderProps) {
  const isFilterModalVisible = useUIStore(
    (state) => state.isFilterModalVisible
  );
  const setFilterModalVisible = useUIStore(
    (state) => state.setFilterModalVisible
  );
  const isImageSheetModalVisible = useUIStore(
    (state) => state.isImageSheetModalVisible
  );
  const setImageSheetModalVisible = useUIStore(
    (state) => state.setImageSheetModalVisible
  );
  const isSettingsModalVisible = useUIStore(
    (state) => state.isSettingsModalVisible
  );
  const setSettingsModalVisible = useUIStore(
    (state) => state.setSettingsModalVisible
  );

  return (
    <>
      {children}

      {/* Recipe filters modal */}
      <SheetModalBase
        isVisible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        title="Recipe filters"
      >
        <FiltersContent />
      </SheetModalBase>

      {/* Image sheet modal */}
      <SheetModalBase
        isVisible={isImageSheetModalVisible}
        onClose={() => setImageSheetModalVisible(false)}
      >
        <ImageSheet />
      </SheetModalBase>

      {/* Settings modal */}
      <SheetModalBase
        isVisible={isSettingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      >
        <SettingsContent />
      </SheetModalBase>

    </>
  );
}
