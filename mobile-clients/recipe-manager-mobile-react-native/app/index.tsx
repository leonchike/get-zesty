import { StatusBar } from "expo-status-bar";
import { Text, View, ScrollView, Image } from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/custom-button";

import icons from "@/constants/icons";

// global context
import { useAuth } from "@/context/AuthContext";

export default function IndexView() {
  const { isLoading, user } = useAuth();

  if (!isLoading && user) return <Redirect href="/groceries" />;

  return (
    <SafeAreaView className="bg-background-light dark:bg-background-dark flex-1">
      <View className="flex-1 justify-center px-4">
        <View className="flex flex-col gap-8">
          <View>
            <Logo />

            <View className="flex flex-row max-w-sm self-center -mt-6">
              <Text className="italic text-center text-2xl font-medium text-gray-600 dark:text-gray-300">
                Welcome to the best way to manage your personal recipes.
              </Text>
            </View>
          </View>

          <View className="mt-6">
            <CustomButton
              handlePress={() => {
                router.push("/log-in");
              }}
              containerStyles="py-3 w-60 self-center rounded-2xl"
              textStyles="text-2xl"
            >
              Get Started
            </CustomButton>
          </View>
        </View>
      </View>
      {/* <StatusBar style="light" backgroundColor="#161622" /> */}
    </SafeAreaView>
  );
}

function Logo() {
  return (
    <View className="w-48 aspect-square self-center">
      <Image
        source={icons.logoFull}
        className="w-full h-full"
        resizeMode="contain"
      />
    </View>
  );
}
