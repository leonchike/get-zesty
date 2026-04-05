import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { useKeepAwake } from "expo-keep-awake";
import { Recipe, ParsedIngredient } from "@/lib/types";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { easeGradient } from "react-native-easing-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

// stores
import useUIStore from "@/stores/global-ui-store";
import { useCookingExperienceStore } from "../stores/cooking-experience-store";
import { useRecipeDisplayStore } from "@/features/recipe-view/stores/recipe-display-store";

// hooks
import { useIngredientAssignment } from "../hooks/use-ingredient-assignment";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// components
import { CookingExperienceProgressBar } from "./cooking-experience-progressbar";
import { InstructionsIngredientsDisplay } from "./instructions-ingredients-display";
import { ProgressButtons } from "./progress-buttons";
import { ActiveTimersPanel } from "@/features/cooking-timer/components/active-timers-panel";

// helpers
import { splitRecipeString } from "@/lib/helpers/split-recipe-string";
import { cn } from "@/lib/helpers/cn";

export default function CookingExperienceContent() {
  const { deviceType } = useDeviceType();
  const insets = useSafeAreaInsets();
  useKeepAwake();

  const colorScheme = useColorScheme();

  const recipe = useUIStore(
    (state) => state.selectedRecipeForCookingExperience
  );

  const setCookingExperienceModalVisible = useUIStore(
    (state) => state.setCookingExperienceModalVisible
  );

  // All hooks must be called unconditionally (before any early return)
  const {
    getCurrentStep,
    setCurrentStep,
    setTotalSteps,
    setCurrentRecipeId,
    showIngredients,
    toggleIngredients,
    totalSteps,
  } = useCookingExperienceStore();
  const { getRecipeScale } = useRecipeDisplayStore();
  const [parsedInstructions, setParsedInstructions] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<ParsedIngredient[]>([]);

  const recipeId = recipe?.id ?? "";
  const currentStep = getCurrentStep(recipeId);

  const { getAssociatedIngredients } = useIngredientAssignment(
    ingredients,
    parsedInstructions
  );

  useEffect(() => {
    if (!recipe) return;
    if (recipe.instructions) {
      const splitInstructions = splitRecipeString(recipe.instructions);
      setParsedInstructions(splitInstructions);
      setTotalSteps(splitInstructions.length);
      setCurrentRecipeId(recipe.id);
    }

    if (typeof recipe.parsedIngredients === "string") {
      setIngredients(JSON.parse(recipe.parsedIngredients));
    } else if (Array.isArray(recipe.parsedIngredients)) {
      setIngredients(recipe.parsedIngredients);
    }
  }, [recipe?.id, recipe?.instructions, recipe?.parsedIngredients]);

  // Now safe to early-return after all hooks
  if (!recipe) return null;

  const { id, title } = recipe;

  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(id, currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(id, currentStep - 1);
    }
  };

  const onDoneCooking = () => {
    setCookingExperienceModalVisible(false);
    setCurrentStep(id, 0);
  };

  const handleStepPress = (stepIndex: number) => {
    setCurrentStep(id, stepIndex);
  };

  const currentAssociatedIngredients = getAssociatedIngredients(currentStep);
  const scale = getRecipeScale(id);

  // Define the pan gesture to detect horizontal swipes and a downward swipe
  const SWIPE_THRESHOLD = 30;

  const swipeGesture = Gesture.Pan().onEnd((event) => {
    const { translationX, translationY } = event;

    const isHorizontalSwipe = Math.abs(translationX) > Math.abs(translationY);

    if (isHorizontalSwipe) {
      if (translationX < -SWIPE_THRESHOLD) {
        runOnJS(goToNextStep)();
      } else if (translationX > SWIPE_THRESHOLD) {
        runOnJS(goToPreviousStep)();
      }
    } else {
      if (translationY > SWIPE_THRESHOLD) {
        runOnJS(setCookingExperienceModalVisible)(false);
      }
    }
  });

  // Warm Mediterranean gradient colors
  const { colors, locations } = easeGradient({
    colorStops: {
      0: { color: "transparent" },
      0.2: {
        color:
          colorScheme === "dark"
            ? "rgba(28,25,23,0.90)"
            : "rgba(249,246,241,0.90)",
      },
      0.5: {
        color:
          colorScheme === "dark"
            ? "rgba(28,25,23,0.99)"
            : "rgba(249,246,241,0.99)",
      },
      1: {
        color:
          colorScheme === "dark"
            ? "rgba(28,25,23,1)"
            : "rgba(249,246,241,1)",
      },
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <GestureDetector gesture={swipeGesture}>
      <View className="flex-1 relative bg-background-light dark:bg-background-dark">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 128 }}
        >
          <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
            <TouchableOpacity
              onPress={toggleIngredients}
              className="py-2 px-4 rounded-full border border-border-light dark:border-border-dark"
            >
              <Text className="font-body-medium text-muted-light dark:text-muted-dark">
                {showIngredients ? "Hide Ingredients" : "Show Ingredients"}
              </Text>
            </TouchableOpacity>
          </View>

          <InstructionsIngredientsDisplay
            recipeId={id}
            recipeName={title}
            ingredients={ingredients}
            currentAssociatedIngredients={currentAssociatedIngredients}
            currentStep={currentStep}
            totalSteps={totalSteps}
            showIngredients={showIngredients}
            scale={scale}
            parsedInstructions={parsedInstructions}
            onStepPress={handleStepPress}
          />
        </ScrollView>

        {/* Footer with gradient blur */}
        <View
          className={cn(
            "absolute bottom-0 left-0 right-0",
            deviceType === "iPad" ? "h-64" : "h-52"
          )}
          style={{ justifyContent: "flex-end" }}
        >
          <MaskedView
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: -40,
              bottom: 0,
            }}
            maskElement={
              <LinearGradient
                locations={locations as [number, number, number]}
                colors={colors as [string, string, string]}
                style={{ flex: 1 }}
              />
            }
          >
            <BlurView
              intensity={80}
              tint={colorScheme === "dark" ? "dark" : "light"}
              style={{ flex: 1 }}
            />
          </MaskedView>

          <ActiveTimersPanel />
          <View className="px-4 pt-4 mb-2 z-10">
            <ProgressButtons
              currentStep={currentStep}
              totalSteps={totalSteps}
              goToPreviousStep={goToPreviousStep}
              goToNextStep={goToNextStep}
              onClose={() => setCookingExperienceModalVisible(false)}
              onDoneCooking={onDoneCooking}
            />
          </View>
          <CookingExperienceProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        </View>
      </View>
    </GestureDetector>
    </GestureHandlerRootView>
  );
}
