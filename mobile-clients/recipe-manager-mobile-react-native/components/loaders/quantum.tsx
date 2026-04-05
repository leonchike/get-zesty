// import React, { useEffect, useRef } from "react";
// import { View, StyleSheet, Animated, Easing } from "react-native";

// const QuantumLoader = () => {
//   const jumpAnimations = useRef(
//     Array(16)
//       .fill(null)
//       .map(() => new Animated.Value(0))
//   ).current;

//   const positions = [
//     { bottom: "24%", right: "-35%", delay: -0.48 },
//     { bottom: "16%", right: "-6%", delay: -0.4 },
//     { bottom: "8%", right: "23%", delay: -0.32 },
//     { bottom: "-1%", right: "51%", delay: -0.24 },
//     { bottom: "38%", right: "-17.5%", delay: -0.4 },
//     { bottom: "30%", right: "10%", delay: -0.32 },
//     { bottom: "22%", right: "39%", delay: -0.24 },
//     { bottom: "14%", right: "67%", delay: -0.16 },
//     { bottom: "53%", right: "-0.8%", delay: -0.32 },
//     { bottom: "44.5%", right: "27%", delay: -0.24 },
//     { bottom: "36%", right: "55.7%", delay: -0.16 },
//     { bottom: "28.7%", right: "84.3%", delay: -0.08 },
//     { bottom: "66.8%", right: "15%", delay: -0.24 },
//     { bottom: "58.8%", right: "43%", delay: -0.16 },
//     { bottom: "50%", right: "72%", delay: -0.08 },
//     { bottom: "42%", right: "100%", delay: 0 },
//   ];

//   const scales = [
//     1, 0.96, 0.98, 1, 0.9, 0.92, 0.94, 0.96, 0.86, 0.88, 0.9, 0.92, 0.82, 0.84,
//     0.86, 0.88,
//   ];

//   const animate = (index) => {
//     return Animated.loop(
//       Animated.sequence([
//         Animated.timing(jumpAnimations[index], {
//           toValue: 1,
//           duration: 375,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//           delay: Math.abs(positions[index].delay * 1000),
//         }),
//         Animated.timing(jumpAnimations[index], {
//           toValue: 0,
//           duration: 375,
//           easing: Easing.inOut(Easing.ease),
//           useNativeDriver: true,
//         }),
//       ])
//     );
//   };

//   useEffect(() => {
//     const animations = jumpAnimations.map((_, index) => animate(index));
//     Animated.parallel(animations).start();
//   }, []);

//   return (
//     <View style={styles.container}>
//       {jumpAnimations.map((animation, index) => (
//         <Animated.View
//           key={index}
//           style={[
//             styles.dot,
//             {
//               bottom: positions[index].bottom,
//               right: positions[index].right,
//               opacity: scales[index],
//               transform: [
//                 {
//                   translateY: animation.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [12, -12],
//                   }),
//                 },
//               ],
//             },
//           ]}
//         />
//       ))}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     width: 60,
//     height: 60,
//     position: "relative",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "flex-start",
//   },
//   dot: {
//     position: "absolute",
//     width: 6,
//     height: 6,
//     backgroundColor: "black",
//     borderRadius: 3,
//   },
// });

// export default QuantumLoader;

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

const QuantumLoader = () => {
  const jumpAnimations = useRef(
    Array(16)
      .fill(null)
      .map(() => new Animated.Value(0))
  ).current;

  const positions = [
    { bottom: "24%" as const, right: "-35%" as const, delay: -0.48 },
    { bottom: "16%" as const, right: "-6%" as const, delay: -0.4 },
    { bottom: "8%" as const, right: "23%" as const, delay: -0.32 },
    { bottom: "-1%" as const, right: "51%" as const, delay: -0.24 },
    { bottom: "38%" as const, right: "-17.5%" as const, delay: -0.4 },
    { bottom: "30%" as const, right: "10%" as const, delay: -0.32 },
    { bottom: "22%" as const, right: "39%" as const, delay: -0.24 },
    { bottom: "14%" as const, right: "67%" as const, delay: -0.16 },
    { bottom: "53%" as const, right: "-0.8%" as const, delay: -0.32 },
    { bottom: "44.5%" as const, right: "27%" as const, delay: -0.24 },
    { bottom: "36%" as const, right: "55.7%" as const, delay: -0.16 },
    { bottom: "28.7%" as const, right: "84.3%" as const, delay: -0.08 },
    { bottom: "66.8%" as const, right: "15%" as const, delay: -0.24 },
    { bottom: "58.8%" as const, right: "43%" as const, delay: -0.16 },
    { bottom: "50%" as const, right: "72%" as const, delay: -0.08 },
    { bottom: "42%" as const, right: "100%" as const, delay: 0 },
  ];

  const scales = [
    1, 0.96, 0.98, 1, 0.9, 0.92, 0.94, 0.96, 0.86, 0.88, 0.9, 0.92, 0.82, 0.84,
    0.86, 0.88,
  ];

  const animate = (index: number) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(jumpAnimations[index], {
          toValue: 1,
          duration: 562.5, // Increased duration for slower animation
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Smoother easing curve
          useNativeDriver: true,
          delay: Math.abs(positions[index].delay * 1500), // increased to slow down
        }),
        Animated.timing(jumpAnimations[index], {
          toValue: 0,
          duration: 562.5, // Increased duration for slower animation
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Smoother easing curve
          useNativeDriver: true,
        }),
      ]),
      {
        iterations: -1,
      }
    );
  };

  useEffect(() => {
    const animations = jumpAnimations.map((_, index) => animate(index));
    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.container}>
      {jumpAnimations.map((animation, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              bottom: positions[index].bottom,
              right: positions[index].right,
              opacity: scales[index],
              transform: [
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, -18], // slightly increased for visual
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 90, // slightly increased for visual
    height: 90, // slightly increased for visual
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  dot: {
    position: "absolute",
    width: 9, // slightly increased for visual
    height: 9, // slightly increased for visual
    backgroundColor: "black",
    borderRadius: 4.5, // slightly increased for visual
  },
});

export default QuantumLoader;
