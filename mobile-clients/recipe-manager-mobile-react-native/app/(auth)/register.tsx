import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import RegisterForm from "@/features/auth/components/register-form";

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
      console.error("Login failed:", error);
    }
  };

  return (
    <SafeAreaView className="bg-backgroundGray-light dark:bg-backgroundGray-dark h-full">
      <ScrollView>
        <View className="w-full flex justify-center min-h-[60vh] px-4 my-6 space-y-8 max-w-md mx-auto">
          <View className="space-y-4">
            <Text className="text-4xl pb-3 font-bold text-center text-gray-800 dark:text-white">
              Create an account
            </Text>
            <Text className="text-gray-600 text-lg pb-6 dark:text-gray-300 text-center">
              Sign up to continue
            </Text>
          </View>

          <RegisterForm />

          <View className="flex flex-row items-center gap-2 pt-8">
            <Text className="text-gray-600 text-lg dark:text-gray-300 text-center">
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push("/log-in")}>
              <Text className="text-brand-light font-semibold text-lg">
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
