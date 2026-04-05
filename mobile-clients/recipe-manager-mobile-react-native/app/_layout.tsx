import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { BottomSheetProvider } from "@/context/BottomSheetContext";
import { StyleSheet } from "react-native";
import ReactQueryProvider from "@/context/ReactQueryProvider";
import { useColorScheme } from "@/hooks/useColorScheme";
import AppProviders from "@/context/AppProviders";

// Fonts
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
} from "@expo-google-fonts/source-sans-3";
import { Comfortaa_700Bold } from "@expo-google-fonts/comfortaa";

// Import your global CSS file
import "../global.css";

// Import AuthProvider
import AuthProvider from "@/context/AuthContext";

// Import RecipeModal
import { RecipeModal } from "@/features/recipe-view/components/recipe-modal";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Warm navigation themes
const WarmLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F9F6F1",
    card: "#F9F6F1",
    text: "#292119",
    border: "#E7E0D8",
    primary: "#FF385C",
  },
};

const WarmDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#1C1917",
    card: "#1C1917",
    text: "#F5F0EB",
    border: "#44403C",
    primary: "#FF385C",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    Comfortaa_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? WarmDarkTheme : WarmLightTheme}
    >
      <AuthProvider>
        <GestureHandlerRootView
          style={[
            styles.container,
            {
              backgroundColor:
                colorScheme === "dark" ? "#1C1917" : "#F9F6F1",
            },
          ]}
        >
          <ReactQueryProvider>
            <AppProviders>
              <BottomSheetProvider>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <RecipeModal />
              </BottomSheetProvider>
            </AppProviders>
          </ReactQueryProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
