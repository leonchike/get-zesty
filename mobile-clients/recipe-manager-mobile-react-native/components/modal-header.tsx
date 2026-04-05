import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import { useColorScheme } from "@/hooks/useColorScheme";
import { warmShadow } from "@/lib/helpers/warm-shadows";
import { XMarkIcon } from "@/components/custom-icons";

const COLORS = {
  light: { surface: "#FFFFFF", fg: "#292119", border: "#E7E0D8" },
  dark: { surface: "#292524", fg: "#F5F0EB", border: "#44403C" },
};

function ModalHeader({
  title,
  showClose = true,
  onClose,
  showBorder = false,
  // Legacy alias
  ModalName,
}: {
  title?: string;
  showClose?: boolean;
  onClose?: () => void;
  showBorder?: boolean;
  /** @deprecated Use `title` instead */
  ModalName?: string;
}) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? COLORS.dark : COLORS.light;

  const displayTitle = title || ModalName;

  return (
    <View
      style={[
        styles.header,
        displayTitle ? styles.headerWithTitle : styles.headerNoTitle,
        showBorder && displayTitle
          ? { borderBottomWidth: 1, borderBottomColor: colors.border }
          : undefined,
      ]}
    >
      {displayTitle && (
        <Text style={[styles.title, { color: colors.fg }]}>
          {displayTitle}
        </Text>
      )}
      {showClose && onClose && (
        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.closeBtn,
            { backgroundColor: colors.surface },
            warmShadow("sm"),
          ]}
        >
          <XMarkIcon width={20} height={20} color={colors.fg} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    paddingHorizontal: 24,
  },
  headerWithTitle: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerNoTitle: {
    paddingTop: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: "PlayfairDisplay_600SemiBold",
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
});

export default ModalHeader;
