import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

const PulseLoader = ({ size = 60, color = "#FF385C", numCircles = 3 }) => {
  const scales = Array.from({ length: numCircles }, () => useSharedValue(0.8)); // Start with a smaller scale

  useEffect(() => {
    scales.forEach((scale, index) => {
      const delay = index * 200; // Reduced delay for smoother animation

      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, {
            duration: 1000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          }), // Increased toValue for a more subtle pulse
          withTiming(0.8, {
            duration: 1000,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          }) // Decreased toValue
        ),
        -1,
        false
      );
    });
  }, []);

  const animatedStyles = scales.map((scale) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: 1 - Math.abs(scale.value - 0.95) * 2, // Adjusted opacity calculation
    }))
  );

  return (
    <View style={styles.container}>
      {animatedStyles.map((animatedStyle, index) => {
        const circleSize = size - index * (size / (numCircles + 1));
        return (
          <Animated.View
            key={index}
            style={[
              styles.pulse,
              {
                width: circleSize,
                height: circleSize,
                backgroundColor: color,
              },
              animatedStyle,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  pulse: {
    borderRadius: 100,
    position: "absolute",
  },
});

export default PulseLoader;
