import { View, Text, Image, TouchableWithoutFeedback } from "react-native";
import React from "react";
import { useColorScheme } from "@/hooks/useColorScheme";
import icons from "@/constants/icons";
import { useAuth } from "@/context/AuthContext";
import { useDeviceType } from "@/hooks/useDeviceType";
import clsx from "clsx";

// stores
import useUIStore from "@/stores/global-ui-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";

const Header = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) => {
  const { isIPhone16Pro, isIpad } = useDeviceType();

  return (
    <View className="flex-row items-center justify-between p-4 pb-2 bg-background-light dark:bg-background-dark">
      <View>
        <Text
          className={clsx(
            isIpad() ? "text-5xl" : isIPhone16Pro() ? "text-3xl" : "text-4xl",
            "font-heading text-foreground-light dark:text-foreground-dark"
          )}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="font-body text-sm mt-1 text-muted-light dark:text-muted-dark">
            {subtitle}
          </Text>
        )}
      </View>
      <View className="flex-row items-center gap-3">
        {actions}
        <UserAvatar />
      </View>
    </View>
  );
};

function UserAvatar() {
  const colorScheme = useColorScheme();
  const { isIpad } = useDeviceType();
  const { user } = useAuth();
  const setSettingsModalVisible = useUIStore(
    (state) => state.setSettingsModalVisible
  );
  const { setSettingsState } = useSettingsStore();

  if (!user) return null;

  const image = user.image
    ? { uri: user.image }
    : colorScheme === "light"
    ? icons.avatarLight
    : icons.avatarDark;

  const handlePress = () => {
    setSettingsState("settingsHome");
    setSettingsModalVisible(true);
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Image source={image} className={clsx(isIpad() ? "w-12 h-12" : "w-10 h-10", "rounded-full")} />
    </TouchableWithoutFeedback>
  );
}

export default Header;
