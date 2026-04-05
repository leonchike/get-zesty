// components/EmailLoginForm.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import InputField from "@/components/input-field";
import CustomButton from "@/components/custom-button";

export default function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithEmail, setPassword: setUserPassword } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
      router.replace("/groceries");
    } catch (error: any) {
      if (error.code === "PASSWORD_NOT_SET") {
        Alert.alert(
          "Set Password",
          "Would you like to set a password for email login?",
          [
            {
              text: "Yes",
              onPress: async () => {
                try {
                  await setUserPassword(email, password);
                  router.replace("/groceries");
                } catch (err) {
                  Alert.alert(
                    "Error",
                    "Failed to set password. Please try again."
                  );
                }
              },
            },
            {
              text: "No",
              style: "cancel",
            },
          ]
        );
      } else if (error.code === "USER_NOT_ACTIVE") {
        Alert.alert(
          "Error",
          "Your account has been deactivated. Please contact hello@getzesty.food for assistance."
        );
      } else {
        Alert.alert("Error", "Invalid email or password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full space-y-4 flex-col gap-4">
      <View className="">
        <InputField
          title="Email"
          value={email}
          handleChange={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          pressableClassName="bg-background-light dark:bg-background-dark"
        />
      </View>

      <View className="space-y-2">
        <InputField
          title="Password"
          value={password}
          handleChange={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          pressableClassName="bg-background-light dark:bg-background-dark"
        />
      </View>

      <View className="w-full mt-4">
        <CustomButton
          isDisabled={isLoading}
          handlePress={handleLogin}
          containerStyles="rounded-xl py-3"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">
              Sign in with Email
            </Text>
          )}
        </CustomButton>
      </View>
    </View>
  );
}
