import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  View,
  type ViewProps,
} from "react-native";
import { BlurView } from "expo-blur";
import clsx from "clsx";

import { useColorScheme } from "@/hooks/useColorScheme";
import {
  glassBorder,
  glassFallback,
  glassFill,
  glassHighlight,
  glassIntensity,
  glassTint,
  liquidGlassShadow,
  type GlassIntensity,
} from "@/constants/glass";

interface GlassViewProps extends ViewProps {
  intensity?: GlassIntensity;
  /** NativeWind rounded-* class applied to the clipping container */
  rounded?: string;
  /** Render the 0.5px top specular highlight line */
  withHighlight?: boolean;
  /** Classes for the inner content view (layout: flex-row, padding, etc.) */
  contentClassName?: string;
  /** Opaque replacement classes on Android / Reduce Transparency */
  fallbackClassName?: string;
  /** Disable the floating shadow (e.g. for full-width headers) */
  withShadow?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const GlassView = ({
  intensity = "regular",
  rounded = "rounded-3xl",
  withHighlight = true,
  contentClassName,
  fallbackClassName,
  withShadow = true,
  className,
  style,
  children,
  ...rest
}: GlassViewProps) => {
  const colorScheme = useColorScheme();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then((enabled) => {
      if (mounted) setReduceTransparency(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduceTransparency
    );
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  // BlurView on Android is costly and inconsistent; render an opaque warm
  // surface there and when the user has Reduce Transparency enabled.
  const useBlur = Platform.OS === "ios" && !reduceTransparency;

  if (!useBlur) {
    return (
      <View
        className={clsx(
          "overflow-hidden",
          rounded,
          fallbackClassName ?? glassFallback,
          className
        )}
        style={[withShadow ? liquidGlassShadow : undefined, style]}
        {...rest}
      >
        <View className={contentClassName}>{children}</View>
      </View>
    );
  }

  return (
    <View
      className={clsx("overflow-hidden", rounded, className)}
      style={[withShadow ? liquidGlassShadow : undefined, style]}
      {...rest}
    >
      <BlurView
        intensity={glassIntensity[intensity]}
        tint={glassTint(colorScheme)}
        className="w-full"
      >
        {withHighlight && <View className={clsx("h-[0.5px]", glassHighlight)} />}
        <View className={clsx(glassFill, glassBorder, rounded, contentClassName)}>
          {children}
        </View>
      </BlurView>
    </View>
  );
};

export default GlassView;
