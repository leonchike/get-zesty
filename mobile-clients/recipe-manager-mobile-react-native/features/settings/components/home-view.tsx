import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";

// hooks
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSettingsStore } from "../store/settings-store";

// helpers
import { warmShadow } from "@/lib/helpers/warm-shadows";

// components
import { Header } from "./shared-components";
import {
  EditIcon,
  LeftChevronIcon,
  LockIcon,
  MinusRoundIcon,
} from "@/components/custom-icons";
import SettingsLogOut from "./log-out";

const SettingsHomeView = () => {
  const { user } = useAuth();
  const { setSettingsState } = useSettingsStore();
  const colorScheme = useColorScheme();

  const handleGoToEditProfile = () => {
    setSettingsState("settingsProfile");
  };

  const handleGoToChangePassword = () => {
    setSettingsState("settingsSecurity");
  };

  const handleGoToDeleteAccount = () => {
    setSettingsState("settingsDeactivate");
  };

  // Generate initials from user name
  const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const iconColor = colorScheme === "dark" ? "#F5F0EB" : "#292119";

  return (
    <View>
      <Header title="Settings" />

      {/* User Profile Card */}
      <View
        className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 items-center gap-3 mb-8"
        style={warmShadow("md")}
      >
        {user?.image ? (
          <Image
            source={{ uri: user.image }}
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-[#FF385C] items-center justify-center">
            <Text className="text-white text-xl font-heading-semibold">
              {getInitials(user?.name)}
            </Text>
          </View>
        )}
        <Text className="text-2xl font-heading-semibold text-foreground-light dark:text-foreground-dark">
          {user?.name}
        </Text>
        <Text className="font-body text-muted-light dark:text-muted-dark">
          {user?.email}
        </Text>
      </View>

      {/* Settings Options Card */}
      <View
        className="bg-surface-light dark:bg-surface-dark rounded-2xl overflow-hidden mb-8"
        style={warmShadow("md")}
      >
        <SettingsRow
          icon={
            <EditIcon width={20} height={20} color={iconColor} />
          }
          title="Profile"
          description="Edit your profile information"
          onPress={handleGoToEditProfile}
          colorScheme={colorScheme}
        />
        <View className="border-b border-border-light dark:border-border-dark mx-4" />
        <SettingsRow
          icon={
            <LockIcon width={20} height={20} color={iconColor} />
          }
          title="Security"
          description="Change your password"
          onPress={handleGoToChangePassword}
          colorScheme={colorScheme}
        />
        <View className="border-b border-border-light dark:border-border-dark mx-4" />
        <SettingsRow
          icon={
            <MinusRoundIcon width={20} height={20} color={iconColor} />
          }
          title="Delete"
          description="Delete your account"
          onPress={handleGoToDeleteAccount}
          colorScheme={colorScheme}
        />
      </View>

      {/* Sign Out Button */}
      <View className="mt-4">
        <SettingsLogOut />
      </View>
    </View>
  );
};

const SettingsRow = ({
  icon,
  title,
  description,
  onPress,
  colorScheme,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  colorScheme: "light" | "dark";
}) => {
  return (
    <TouchableOpacity onPress={onPress} className="px-4 py-4">
      <View className="flex-row items-center justify-between w-full gap-4">
        <View className="flex-row items-center gap-4">
          <View className="w-10 h-10 rounded-full bg-background-light dark:bg-background-dark items-center justify-center">
            {icon}
          </View>
          <View className="flex-col gap-1">
            <Text className="text-lg font-body-semibold text-foreground-light dark:text-foreground-dark">
              {title}
            </Text>
            <Text className="font-body text-muted-light dark:text-muted-dark">
              {description}
            </Text>
          </View>
        </View>
        <View style={{ transform: [{ rotate: "180deg" }] }}>
          <LeftChevronIcon
            width={14}
            height={14}
            color={colorScheme === "dark" ? "#A8A29E" : "#78716C"}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SettingsHomeView;
