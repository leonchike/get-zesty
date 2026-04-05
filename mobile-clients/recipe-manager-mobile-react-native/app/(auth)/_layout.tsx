import { StatusBar } from "expo-status-bar";
import React from "react";
import { Stack } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";

const AuthLayout = () => {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack>
        <Stack.Screen name="log-in" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        {/* <Stack.Screen name="sign-up" options={{ headerShown: false }} /> */}
      </Stack>

      <StatusBar
        style="auto"
        backgroundColor={colorScheme === "dark" ? "#161622" : "#fff"}
      />
    </>
  );
};

export default AuthLayout;
