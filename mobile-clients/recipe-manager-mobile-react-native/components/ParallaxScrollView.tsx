import type { PropsWithChildren, ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedView } from "@/components/ThemedView";
import { useSafeBottomTabOverflow } from "@/hooks/useSafeBottomTabOverflow";
import { useColorScheme } from "@/hooks/useColorScheme";
import { warmShadow } from "@/lib/helpers/warm-shadows";

const HEADER_HEIGHT = 320;
const SCROLL_THRESHOLD = 200;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  headerOverlay?: ReactElement;
  title?: string;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  headerOverlay,
  title,
}: Props) {
  const colorScheme = useColorScheme();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const bottom = useSafeBottomTabOverflow();

  // Surface token colors for floating header
  const floatingHeaderBg = colorScheme === "dark" ? "#292524" : "#FFFFFF";
  const titleColor = colorScheme === "dark" ? "#F5F0EB" : "#292119";

  // Animate the main header image
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [2, 1, 1]
          ),
        },
      ],
    };
  });

  // Animate the floating header
  const floatingHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [SCROLL_THRESHOLD - 50, SCROLL_THRESHOLD],
      [0, 1],
      "clamp"
    );

    return {
      opacity: withTiming(opacity, { duration: 150 }),
    };
  });

  // Animate the original header overlay
  const originalOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [SCROLL_THRESHOLD - 50, SCROLL_THRESHOLD],
      [1, 0],
      "clamp"
    );

    return {
      opacity: withTiming(opacity, { duration: 150 }),
    };
  });

  return (
    <ThemedView style={styles.container}>
      {/* Floating Header */}
      <Animated.View
        style={[
          styles.floatingHeader,
          { backgroundColor: floatingHeaderBg },
          warmShadow("md"),
          floatingHeaderStyle,
        ]}
      >
        <View style={styles.safeArea} />
        <View style={styles.headerContent}>
          {title && (
            <Animated.Text
              className="pt-2 font-body-semibold"
              numberOfLines={1}
              style={[
                styles.headerTitle,
                { color: titleColor },
              ]}
            >
              {title}
            </Animated.Text>
          )}
        </View>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={{ paddingBottom: bottom }}
      >
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: headerBackgroundColor[colorScheme] },
            headerAnimatedStyle,
          ]}
        >
          {headerImage}
          {/* Gradient overlay at bottom of hero image */}
          <LinearGradient
            colors={[
              "transparent",
              colorScheme === "dark"
                ? "rgba(28, 25, 23, 0.85)"
                : "rgba(249, 246, 241, 0.75)",
            ]}
            style={styles.heroGradient}
          />
          {headerOverlay && (
            <Animated.View style={[styles.headerOverlay, originalOverlayStyle]}>
              {headerOverlay}
            </Animated.View>
          )}
        </Animated.View>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 16,
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 0,
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  safeArea: {
    height: 44, // Height for status bar
  },
  headerContent: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  overlayContainer: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 40,
  },
});
