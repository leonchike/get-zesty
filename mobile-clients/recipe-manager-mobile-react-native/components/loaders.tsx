import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import Reanimated, {
  withRepeat,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from "react-native-reanimated";

interface LoaderProps {
  size?: number;
  color?: string;
}

// Dots Wave Animation
export const DotsWave: React.FC<LoaderProps> = ({
  size = 40,
  color = "#000000",
}) => {
  const dots = new Array(3).fill(0);
  const animations = dots.map(() => useSharedValue(0));

  React.useEffect(() => {
    dots.forEach((_, index) => {
      animations[index].value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    });
  }, []);

  return (
    <View style={[styles.dotsContainer, { height: size }]}>
      {dots.map((_, index) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ translateY: animations[index].value * -(size / 2) }],
        }));

        return (
          <Reanimated.View
            key={index}
            style={[
              styles.dot,
              {
                width: size / 5,
                height: size / 5,
                backgroundColor: color,
                marginHorizontal: size / 10,
              },
              animatedStyle,
            ]}
          />
        );
      })}
    </View>
  );
};

// Spinner Animation
export const Spinner: React.FC<LoaderProps> = ({
  size = 40,
  color = "#000000",
}) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Reanimated.View
      style={[
        styles.spinner,
        {
          width: size,
          height: size,
          borderWidth: size / 10,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

// Pulse Animation
export const Pulse: React.FC<LoaderProps> = ({
  size = 40,
  color = "#000000",
}) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 750 }),
        withTiming(1, { duration: 750 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Reanimated.View
      style={[
        styles.pulse,
        {
          width: size,
          height: size,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    borderRadius: 100,
  },
  spinner: {
    borderRadius: 100,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  pulse: {
    borderRadius: 100,
    opacity: 0.6,
  },
});

// Usage example:
// <DotsWave size={50} color="#FF0000" />
// <Spinner size={50} color="#00FF00" />
// <Pulse size={50} color="#0000FF" />
