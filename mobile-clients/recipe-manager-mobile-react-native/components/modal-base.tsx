import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ModalProps,
  KeyboardAvoidingView,
  Button,
  Animated,
  Keyboard,
} from "react-native";
import React from "react";
import clsx from "clsx";

const ModalBase = ({
  children,
  isVisible,
  onClose,
  withInput = false,
  className,
  modalProps,
  ModalName,
}: {
  children: React.ReactNode;
  isVisible: boolean;
  withInput?: boolean;
  onClose?: () => void;
  className?: string;
  modalProps?: ModalProps;
  ModalName?: string;
}) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height / 60,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardWillHide = Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const content = withInput ? (
    <KeyboardAvoidingView
      behavior="padding"
      className="items-center justify-center flex-1 px-3 bg-zinc-900/60 dark:bg-zinc-900/95"
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      keyboardVerticalOffset={0}
      style={{ flex: 1 }}
      contentContainerStyle={{ flex: 1 }}
    >
      <Animated.View
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          transform: [{ translateY }],
        }}
      >
        {children}
      </Animated.View>
    </KeyboardAvoidingView>
  ) : (
    <View
      className="items-center justify-center flex-1 px-3 bg-zinc-900/60 dark:bg-zinc-900/95"
      onTouchStart={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      {children}
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      onRequestClose={onClose}
      animationType="fade"
      statusBarTranslucent
    >
      {content}
    </Modal>
  );
};

export default ModalBase;
