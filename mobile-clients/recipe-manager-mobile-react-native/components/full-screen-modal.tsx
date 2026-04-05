import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  PanResponder,
  GestureResponderEvent,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { XMarkIcon } from "./custom-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { warmShadow } from "@/lib/helpers/warm-shadows";
import clsx from "clsx";

interface FullScreenModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  gestureEnabled?: boolean;
  showCloseButton?: boolean;
  onModalShow?: () => void;
  onModalHide?: () => void;
  animationType?: "slide" | "fade";
  zIndex?: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  visible,
  onClose,
  children,
  gestureEnabled = true,
  showCloseButton = true,
  onModalShow,
  onModalHide,
  animationType = "slide",
  zIndex = 999, // Lower than SheetModalBase which typically uses 1000+
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Internal state to control Modal visibility - separate from external visible prop
  const [modalVisible, setModalVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to significant downward swipes when gesture is enabled
        // Require a minimum distance and velocity to avoid conflicts with scrolling
        // Also check that we're near the top of the screen to avoid conflicts with content scrolling
        const isSignificantDownwardSwipe =
          gestureState.dy > 30 && // Increased minimum downward movement
          Math.abs(gestureState.dx) < Math.abs(gestureState.dy) && // More vertical than horizontal
          gestureState.vy > 0.4 && // Increased minimum downward velocity
          evt.nativeEvent.pageY < 150; // Only respond if touch started near top of screen

        return gestureEnabled && isSignificantDownwardSwipe;
      },
      onPanResponderGrant: () => {
        // Stop any ongoing animations when gesture starts
        translateY.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          // Apply some resistance to make it feel more natural
          const resistance = Math.max(0.3, 1 - gestureState.dy / SCREEN_HEIGHT);
          translateY.setValue(gestureState.dy * resistance);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (
          gestureState.dy > SWIPE_THRESHOLD ||
          gestureState.vy > SWIPE_VELOCITY_THRESHOLD
        ) {
          // Swipe down to close - use the same smooth animation
          closeModal();
        } else {
          // Snap back to position with smooth spring
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && !modalVisible) {
      // Show modal and animate in
      setModalVisible(true);
      setIsAnimating(true);

      // Reset position
      translateY.setValue(SCREEN_HEIGHT);
      opacity.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimating(false);
        onModalShow?.();
      });
    } else if (!visible && modalVisible && !isAnimating) {
      // Animate out when external visible becomes false
      closeModal();
    }
  }, [visible, modalVisible, isAnimating]);

  const closeModal = () => {
    if (isAnimating) return; // Prevent multiple close animations

    setIsAnimating(true);

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 450,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setIsAnimating(false);
      onClose();
      onModalHide?.();
    });
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      animationType="none" // We handle our own animations
      onRequestClose={closeModal}
    >
      <View style={{ flex: 1, zIndex }}>
        {/* Backdrop - warm overlay */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(41, 33, 25, 0.5)",
            opacity,
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeModal}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [{ translateY }],
            backgroundColor: colorScheme === "dark" ? "#1C1917" : "#F9F6F1",
          }}
          {...(gestureEnabled ? panResponder.panHandlers : {})}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            {/* Header with close button */}
            {showCloseButton && (
              <View
                className="absolute top-0 right-0 z-50"
                style={{
                  paddingTop: insets.top + 10,
                  paddingRight: 16,
                }}
              >
                <TouchableOpacity
                  onPress={closeModal}
                  className={clsx(
                    "w-10 h-10 rounded-full items-center justify-center",
                    "bg-[#F9F6F1]/80 dark:bg-[#292524]/80",
                    "border border-[#E7E0D8] dark:border-[#44403C]"
                  )}
                  style={warmShadow("md")}
                >
                  <XMarkIcon
                    width={24}
                    height={24}
                    color={colorScheme === "dark" ? "#F5F0EB" : "#292119"}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Content */}
            <View style={{ flex: 1 }}>
              {children}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};
