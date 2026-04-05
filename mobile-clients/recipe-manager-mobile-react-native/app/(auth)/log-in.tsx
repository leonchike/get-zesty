import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import EmailLoginForm from "@/features/auth/components/login-form";
import { logger } from "@/lib/utils/logger";

// utils
import { cn } from "@/lib/helpers/cn";

// global context
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // Navigate to home screen on success
      router.replace("/groceries");
    } catch (error) {
      // Handle error
      logger.error("Login failed:", error);
    }
  };

  return (
    <SafeAreaView className="bg-backgroundGray-light dark:bg-backgroundGray-dark h-full">
      <ScrollView>
        <View className="w-full flex justify-center min-h-[60vh] px-4 my-6 space-y-8 max-w-md mx-auto">
          <View className="space-y-4">
            <Text className="text-4xl pb-3 font-bold text-center text-gray-800 dark:text-white">
              Welcome Back
            </Text>
            <Text className="text-gray-600 text-lg pb-6 dark:text-gray-300 text-center">
              Sign in to continue
            </Text>
          </View>

          <EmailLoginForm />

          <View className="flex flex-row items-center gap-2 pt-8">
            <Text className="text-gray-600 text-lg dark:text-gray-300 text-center">
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text className="text-brand-light font-semibold text-lg">
                Sign up
              </Text>
            </TouchableOpacity>
          </View>

          {/* <View className="flex flex-row items-center">
            <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
            <Text className="mx-4 my-6 text-gray-500">or</Text>
            <View className="flex-1 h-px bg-gray-300 dark:bg-gray-700" />
          </View> */}

          {/* <TouchableOpacity
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3"
            onPress={handleGoogleLogin}
          >
            <Text className="text-gray-800 dark:text-white text-center font-semibold">
              Sign in with Google
            </Text>
          </TouchableOpacity> */}

          {/* <View className="flex flex-row justify-center space-x-1">
            <Text className="text-gray-600 dark:text-gray-300">
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
                <Text className="text-blue-600 font-semibold">Sign up</Text>
              </TouchableOpacity>
          </View> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
