import React from "react";
import { View, ViewProps } from "react-native";

interface ProgressProps extends ViewProps {
  value?: number;
  indicatorColor?: string;
  className?: string;
}

const Progress = React.forwardRef<View, ProgressProps>(
  ({ className = "", value = 0, indicatorColor, style, ...props }, ref) => {
    // Ensure value is between 0 and 100
    const clampedValue = Math.min(Math.max(value, 0), 100);

    return (
      <View
        ref={ref}
        className={`relative h-8 w-full overflow-hidden rounded-full bg-secondary ${className}`}
        style={style}
        {...props}
      >
        <View
          className={`absolute h-full ${indicatorColor || "bg-primary"}`}
          style={{
            width: "100%",
            transform: [{ translateX: `${-100 + clampedValue}%` }],
          }}
        />
      </View>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
