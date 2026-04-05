import { Tabs, Redirect } from "expo-router";
import React from "react";
import { Platform, View, Image, StyleSheet } from "react-native";
import clsx from "clsx";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { easeGradient } from "react-native-easing-gradient";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDeviceType } from "@/hooks/useDeviceType";
import FloatingPillNav from "@/components/floating-pill-nav";
import GlobalTimersIndicator from "@/features/cooking-timer/components/global-timers-indicator";

// auth check
import { useAuth } from "@/context/AuthContext";

// icons
import icons from "@/constants/icons";

export default function TabLayout() {
  const { isIPhone16Pro } = useDeviceType();
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();

  const { colors, locations } = easeGradient({
    colorStops: {
      0: {
        color:
          colorScheme === "dark"
            ? "rgba(28, 25, 23, 0.90)"
            : "rgba(249, 246, 241, 0.90)",
      },
      0.7: {
        color:
          colorScheme === "dark"
            ? "rgba(28, 25, 23, 0.99)"
            : "rgba(249, 246, 241, 0.99)",
      },
      1: { color: colorScheme === "dark" ? "#1C1917" : "#F9F6F1" },
    },
  });

  if (!isAuthenticated && !isLoading) {
    return <Redirect href="/log-in" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: Colors[colorScheme].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            display: "none", // Hide the default tab bar
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, focused }) => (
            // <IconSymbol size={28} name="paperplane.fill" color={color} />
            <TabIcon
              icon={icons.recipesIcon}
              color={color}
              name="Recipes"
              focused={focused}
            />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("index", { screen: "index" });
          },
        })}
      />
      {/* <Tabs.Screen
        name="new-recipe"
        options={{
          title: "New Recipe",
          tabBarIcon: ({ color, focused }) => (
            // <IconSymbol size={28} name="house.fill" color={color} />
            <TabIcon
              icon={icons.newRecipeIcon}
              color={color}
              name="New Recipe"
              focused={focused}
            />
          ),
        }}
      /> */}

      <Tabs.Screen
        name="groceries"
        options={{
          title: "Groceries",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.groceryIcon}
              color={color}
              name="Groceries"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
    <GlobalTimersIndicator />
    <FloatingPillNav />
    </>
  );
}

const TabIcon = ({
  icon,
  color,
  name,
  focused,
}: {
  icon: any;
  color: string;
  name: string;
  focused: boolean;
}) => {
  const { isIPhone16Pro } = useDeviceType();

  return (
    <View className={clsx(isIPhone16Pro() ? "pt-4" : "pt-8")}>
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className={clsx(isIPhone16Pro() ? "w-7 h-7" : "w-8 h-8")}
      />
      {/* <Text
        className={clsx(
          focused
            ? "font-bold, text-brand-light"
            : "font-medium, text-[#11181C] dark:text-[#ECEDEE]",
          "text-[12px] text-brand-light dark:text-brand-dark text-center min-w-[60px]"
        )}
        numberOfLines={1}
      >
        {name}
      </Text> */}
    </View>
  );
};
