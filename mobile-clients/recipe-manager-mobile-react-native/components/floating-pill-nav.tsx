import React from "react";
import {
  View,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import clsx from "clsx";

import { HapticTab } from "@/components/HapticTab";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDeviceType } from "@/hooks/useDeviceType";
import icons from "@/constants/icons";

interface NavItem {
  route: string;
  icon: any;
  name: string;
}

const liquidGlassShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  android: {
    elevation: 12,
  },
  default: {},
});

const FloatingPillNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const { isIPhone16Pro, isIpad } = useDeviceType();
  const insets = useSafeAreaInsets();

  const navItems: NavItem[] = [
    { route: "/", icon: icons.recipesIcon, name: "Recipes" },
    { route: "/groceries", icon: icons.groceryIcon, name: "Groceries" },
  ];

  const handlePress = (item: NavItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (item.route === "/") {
      router.push({ pathname: "/", params: { screen: "index" } } as any);
    } else {
      router.push(item.route as any);
    }
  };

  const isActive = (route: string) => {
    if (route === "/") {
      return pathname === "/" || pathname.startsWith("/index");
    }
    return pathname === route;
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 items-center"
      style={{
        paddingBottom: Math.max(insets.bottom, 30),
      }}
      pointerEvents="box-none"
    >
      <View
        className={clsx(
          "mx-4",
          "overflow-hidden rounded-full",
          isIpad() ? "max-w-lg" : "w-full max-w-[220px]"
        )}
        style={liquidGlassShadow}
      >
        <BlurView
          intensity={120}
          tint={
            colorScheme === "dark"
              ? "systemChromeMaterialDark"
              : "systemChromeMaterialLight"
          }
          className="w-full"
        >
          {/* Top specular highlight edge */}
          <View className="h-[0.5px] bg-white/20 dark:bg-white/10" />

          <View
            className={clsx(
              "flex-row items-center justify-around rounded-full",
              "bg-white/15 dark:bg-white/[0.08]",
              "border-[0.5px] border-white/30 dark:border-white/15",
              isIpad() ? "px-12 py-6" : "px-8 py-4"
            )}
          >
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => handlePress(item)}
                className="items-center justify-center rounded-full"
                activeOpacity={0.7}
              >
                <View className="items-center justify-center">
                  {isActive(item.route) && (
                    <View
                      className="absolute rounded-full bg-[#F0960A]/15"
                      style={{
                        width: isIpad() ? 48 : 40,
                        height: isIpad() ? 48 : 40,
                      }}
                    />
                  )}
                  <Image
                    source={item.icon}
                    resizeMode="contain"
                    tintColor={
                      isActive(item.route)
                        ? "#F0960A"
                        : colorScheme === "dark"
                        ? "#A8A29E"
                        : "#78716C"
                    }
                    className={clsx(
                      isIpad() ? "w-9 h-9" : "w-8 h-8",
                      "transition-all duration-200"
                    )}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </View>
    </View>
  );
};

export default FloatingPillNav;
