import {
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDeviceType } from "@/hooks/useDeviceType";
import ModalHeader from "@/components/modal-header";

const COLORS = {
  light: { bg: "#F9F6F1" },
  dark: { bg: "#1C1917" },
};

const SheetModalBase = ({
  children,
  isVisible,
  onClose,
  title,
  forceFullScreen = false,
}: {
  children: React.ReactNode;
  isVisible: boolean;
  onClose?: () => void;
  className?: string;
  title?: string;
  forceFullScreen?: boolean;
}) => {
  const { deviceType } = useDeviceType();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const isFullScreen = forceFullScreen || deviceType === "iPad";

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle={isFullScreen ? "fullScreen" : "pageSheet"}
      supportedOrientations={["portrait", "landscape"]}
    >
      {/* Use absolute positioning to guarantee fill — flex:1 can fail
          inside pageSheet Modals on physical iOS devices */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.bg,
            paddingTop: isFullScreen ? insets.top : 0,
          },
        ]}
      >
        {/* Header */}
        <ModalHeader
          title={title}
          onClose={onClose}
          showBorder={!!title}
        />

        {/* Content area (children control scroll, footers, etc.) */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          {children}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});

export default SheetModalBase;
