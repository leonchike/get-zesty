import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  PanResponder,
} from "react-native";

// stores
import { useSettingsStore } from "../store/settings-store";

// Components
import SettingsHomeView from "./home-view";
import SettingsProfileView from "./profile-view";
import SettingsSecurityView from "./security-view";
import SettingsDeactivateView from "./deactivate-view";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SettingsContent = () => {
  const settingsState = useSettingsStore((state) => state.settingsState);
  const setSettingsState = useSettingsStore((state) => state.setSettingsState);

  // Animated value for horizontal slide (0 => Home, 1 => Sub-page)
  const animatedValue = useRef(new Animated.Value(0)).current;
  const index = settingsState === "settingsHome" ? 0 : 1;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: index,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [index]);

  // Interpolate the container's translateX
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH],
  });

  /**
   * 1) Create a PanResponder that listens for left→right swipes.
   * 2) If the user swipes right far enough (dx > THRESHOLD),
   *    we set the store back to "settingsHome".
   * 3) Only enable the responder if we're on a sub-page (index=1).
   */
  const SWIPE_THRESHOLD = 30; // Adjust as needed
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // Temporarily allow all gestures for testing
        return true; // Changed from settingsState !== "settingsHome"
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        // Make this more lenient
        return Math.abs(dx) > 2 && Math.abs(dy) < 100;
      },
      onPanResponderGrant: () => {},
      onPanResponderMove: () => {},
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        if (dx > SWIPE_THRESHOLD) {
          setSettingsState("settingsHome");
        }
      },
    })
  ).current;

  // Dynamically render whichever sub-screen
  const renderRightPane = () => {
    switch (settingsState) {
      case "settingsProfile":
        return <SettingsProfileView />;
      case "settingsSecurity":
        return <SettingsSecurityView />;
      case "settingsDeactivate":
        return <SettingsDeactivateView />;
      default:
        return null; // Show nothing if for some reason it's "settingsHome"
    }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        style={[styles.innerContainer, { transform: [{ translateX }] }]}
      >
        {/* LEFT SCREEN (HOME) */}
        <View style={styles.screen}>
          <ViewWrapper>
            <SettingsHomeView />
          </ViewWrapper>
        </View>

        {/* RIGHT SCREEN (SUB-PAGES) */}
        <View style={styles.screen}>
          <ViewWrapper>{renderRightPane()}</ViewWrapper>
        </View>
      </Animated.View>
    </View>
  );
};

const ViewWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <View className="flex-1 px-6 max-w-3xl mx-auto w-full">{children}</View>
  );
};

export default SettingsContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  innerContainer: {
    flex: 1,
    flexDirection: "row",
    width: SCREEN_WIDTH * 2, // enough for home + 1 sub-page
  },
  screen: {
    width: SCREEN_WIDTH,
  },
});
