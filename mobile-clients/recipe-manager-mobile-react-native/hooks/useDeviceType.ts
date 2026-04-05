import { useState, useEffect } from "react";
import { Dimensions, Platform, ScaledSize } from "react-native";

// Device-specific dimensions (points, not pixels)
const DEVICE_DIMENSIONS = {
  IPHONE_16_PRO: {
    width: 393,
    height: 852,
  },
  IPHONE_16_PRO_MAX: {
    width: 430,
    height: 932,
  },
  // iPad dimensions vary, so we'll use a minimum width approach
  IPAD_MIN_WIDTH: 768,
} as const;

type DeviceType = "iPhone16Pro" | "iPhone16ProMax" | "iPad" | "unknown";

interface DimensionsInfo {
  window: ScaledSize;
  screen: ScaledSize;
}

export const useDeviceType = () => {
  const [dimensions, setDimensions] = useState<DimensionsInfo>({
    window: Dimensions.get("window"),
    screen: Dimensions.get("screen"),
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      "change",
      ({ window, screen }) => {
        setDimensions({ window, screen });
      }
    );

    return () => subscription.remove();
  }, []);

  const { width, height } = dimensions.window;

  const getDeviceType = (): DeviceType => {
    // Only proceed if we're on iOS
    if (Platform.OS !== "ios") return "unknown";

    // Check for iPad first
    if (width >= DEVICE_DIMENSIONS.IPAD_MIN_WIDTH) {
      return "iPad";
    }

    // For iPhone detection, we'll allow for small variations in dimensions
    // due to different screen modes and safe areas
    const dimensionMatchesWithTolerance = (
      actualWidth: number,
      actualHeight: number,
      targetWidth: number,
      targetHeight: number,
      tolerance = 10
    ) => {
      return (
        Math.abs(actualWidth - targetWidth) <= tolerance &&
        Math.abs(actualHeight - targetHeight) <= tolerance
      );
    };

    if (
      dimensionMatchesWithTolerance(
        width,
        height,
        DEVICE_DIMENSIONS.IPHONE_16_PRO.width,
        DEVICE_DIMENSIONS.IPHONE_16_PRO.height
      )
    ) {
      return "iPhone16Pro";
    }

    if (
      dimensionMatchesWithTolerance(
        width,
        height,
        DEVICE_DIMENSIONS.IPHONE_16_PRO_MAX.width,
        DEVICE_DIMENSIONS.IPHONE_16_PRO_MAX.height
      )
    ) {
      return "iPhone16ProMax";
    }

    return "unknown";
  };

  const isIpad = () => getDeviceType() === "iPad";
  const isIPhone16Pro = () => getDeviceType() === "iPhone16Pro";
  const isIPhone16ProMax = () => getDeviceType() === "iPhone16ProMax";

  // Get scaling factors for each device type
  const getScaleFactor = () => {
    switch (getDeviceType()) {
      case "iPhone16Pro":
        return 1;
      case "iPhone16ProMax":
        return 1.094; // 430/393
      case "iPad":
        return 1.954; // 768/393
      default:
        return 1;
    }
  };

  // Helper for scaling values based on device
  const scaleValue = (baseValue: number) => {
    return Math.round(baseValue * getScaleFactor());
  };

  return {
    deviceType: getDeviceType(),
    isIpad,
    isIPhone16Pro,
    isIPhone16ProMax,
    scaleValue,
    dimensions: {
      width,
      height,
    },
  };
};
