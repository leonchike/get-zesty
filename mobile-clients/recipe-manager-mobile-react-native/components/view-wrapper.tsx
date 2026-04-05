import { View } from "react-native";

export const ViewWrapper = ({ children }: { children: React.ReactNode }) => {
  return <View className="px-4">{children}</View>;
};

export const horizontalPaddingValue = "px-4";

export const VerticalSpacer = ({ height = 16 }: { height?: number }) => {
  return <View style={{ height }} />;
};
