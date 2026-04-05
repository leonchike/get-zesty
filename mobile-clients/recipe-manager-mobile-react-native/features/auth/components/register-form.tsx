// components/EmailLoginForm.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import InputField from "@/components/input-field";
import CustomButton from "@/components/custom-button";

export default function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signupWithEmail } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      await signupWithEmail(email, password, name);
      router.replace("/groceries");
    } catch (error: any) {
      Alert.alert("Error", "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="w-full space-y-4 flex-col gap-4">
      <View className="space-y-2">
        <InputField
          title="Name"
          value={name}
          handleChange={setName}
          placeholder="Enter your name"
          keyboardType="default"
          autoCapitalize="words"
          autoComplete="name"
          pressableClassName="bg-background-light dark:bg-background-dark"
        />
      </View>

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
              Sign up with Email
            </Text>
          )}
        </CustomButton>
      </View>
    </View>
  );
}
