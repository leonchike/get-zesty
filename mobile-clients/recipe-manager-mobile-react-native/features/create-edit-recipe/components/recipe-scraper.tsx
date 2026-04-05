import { useState } from "react";
import { View, Text } from "react-native";
import { useRecipeStore } from "../stores/recipe-form-store";
import CustomButton from "@/components/custom-button";
import { LinkIcon } from "@/components/custom-icons";
import { AutoExpandTextInput } from "@/components/input-field";
import ModalBase from "@/components/modal-base";
import { useColorScheme } from "@/hooks/useColorScheme";

type ModalState = "idle" | "loading" | "success" | "error";

export const RecipeScraper = () => {
  const colorScheme = useColorScheme();
  const {
    doScrapeRecipe,
    setScrapeUrl,
    scrapeUrl,
    resetScrapeForm,
    scrapeError,
  } = useRecipeStore();
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleScrapeRecipe = async () => {
    if (!scrapeUrl) return;

    try {
      setModalState("loading");
      await doScrapeRecipe(scrapeUrl);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error generating recipe:", error);
      setModalState("error");
    } finally {
      setModalState("idle");
      resetScrapeForm();
    }
  };

  const handlePress = () => {
    resetScrapeForm();
    setIsModalVisible(true);
  };

  return (
    <View className="flex-1 items-center justify-center gap-4 w-full">
      <CustomButton
        onPress={handlePress}
        variant="secondary"
        containerStyles="w-full"
        title="Import Recipe"
        leftIcon={
          <LinkIcon
            color={colorScheme === "dark" ? "#151718" : "#FFFFFF"}
            width={20}
            height={24}
          />
        }
      />

      <ModalBase
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        ModalName="Import Recipe from URL"
        withInput
      >
        <View className="w-[90%] bg-background-light dark:bg-background-dark rounded-xl p-6">
          <View className="gap-2">
            <View className="rounded-full flex-row items-center gap-2">
              <LinkIcon color="#FF385C" width={20} height={28} />
              <Text className="text-2xl font-body-semibold text-foreground-light dark:text-foreground-dark">
                Import Recipe from URL
              </Text>
            </View>
            <Text className="font-body text-foreground-light dark:text-foreground-dark opacity-80">
              Enter a URL to import a recipe
            </Text>
          </View>
          <View className="mt-6">
            <AutoExpandTextInput
              value={scrapeUrl || ""}
              onChangeText={setScrapeUrl}
              placeholder="Enter a URL to import a recipe"
              minHeight={180}
            />
          </View>
          {scrapeError && (
            <Text className="text-red-500 font-body text-sm">
              {scrapeError}
            </Text>
          )}
          <View className="mt-2">
            <CustomButton
              onPress={handleScrapeRecipe}
              isDisabled={!scrapeUrl || modalState === "loading"}
              isLoading={modalState === "loading"}
              title={
                modalState === "loading"
                  ? "Importing Recipe..."
                  : "Import Recipe"
              }
            />
          </View>
        </View>
      </ModalBase>
    </View>
  );
};
