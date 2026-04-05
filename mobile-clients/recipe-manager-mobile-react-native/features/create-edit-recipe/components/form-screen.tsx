import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import {
  useRecipeStore,
  initialRecipeState,
} from "../stores/recipe-form-store";
import { useNavigateToRecipeModal } from "@/hooks/useNavigateToRecipeModal";
import { Recipe } from "@/lib/types";
import { getRecipe } from "../actions/recipe-actions";
import { cn } from "@/lib/helpers/cn";
import { APP_ROUTES } from "@/lib/routes";

// components
import InputField, { AutoExpandTextInput } from "@/components/input-field";
import PopUpPicker from "@/components/pop-up-picker";
import SwitchInput from "@/components/switch-input";
import CustomTimeInput from "@/components/custom-time-input";
import ComboBox from "@/components/combo-box";
import { RecipeScraper } from "./recipe-scraper";
import ImageController from "./image-upload/image-controller";
import { DeleteRecipe } from "./delete-recipe";
import { FormSection } from "./form-section";
import { FormFooter } from "./form-footer";
import ModalHeader from "@/components/modal-header";
import { useQueryClient } from "@tanstack/react-query";
import { useImageUploadStore } from "../stores/recipe-form-image-upload-store";

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";

// data
import {
  CUISINE_TYPES,
  RECIPE_MEAL_TYPES,
} from "@/lib/helpers/recipe-constants";

interface RecipeFormScreenProps {
  recipeId?: string;
}

type FormValues = Partial<Recipe>;

const difficulties: { label: string; value: "EASY" | "MEDIUM" | "HARD" }[] = [
  { label: "Easy", value: "EASY" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Hard", value: "HARD" },
];

export const RecipeFormScreen: React.FC<RecipeFormScreenProps> = ({
  recipeId,
}) => {
  const { isIpad } = useDeviceType();
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigateToRecipeModal = useNavigateToRecipeModal();
  const {
    recipe,
    setRecipe,
    submitRecipe,
    isSubmitting,
    recipeID,
    setRecipeID,
    reset: resetStore,
    scrapeSuccess,
  } = useRecipeStore();

  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: recipe || initialRecipeState,
  });

  useEffect(() => {
    const fetchRecipe = async () => {
      if (recipeId) {
        setRecipeID(recipeId);

        try {
          const fetchedRecipe: Recipe = await getRecipe({
            recipeId,
          });
          if (fetchedRecipe) {
            setRecipe(fetchedRecipe);
            reset(fetchedRecipe);
          }
        } catch (error) {
          console.error("Error fetching recipe:", error);
        }
      } else {
        setRecipeID(null);
        setRecipe(null);
        resetStore();
        reset(initialRecipeState);
        useImageUploadStore.getState().reset();
      }
    };

    fetchRecipe();

    return () => {
      resetStore();
      reset(initialRecipeState);
      useImageUploadStore.getState().reset();
    };
  }, [recipeId, setRecipeID, reset, setRecipe]);

  // If scrape success, reset the form with the scraped recipe
  useEffect(() => {
    if (scrapeSuccess && recipe) {
      reset(recipe);
      setRecipe(recipe);
    }
  }, [scrapeSuccess, recipe, reset, setRecipe]);

  const onSubmit = async (data: FormValues) => {
    await queryClient.invalidateQueries({ queryKey: ["recipe", recipeID] });
    await queryClient.invalidateQueries({ queryKey: ["recipes"] });

    const resultID = await submitRecipe(data);
    if (resultID) {
      await queryClient.invalidateQueries({ queryKey: ["recipe", resultID] });
      navigateToRecipeModal(resultID);
    } else {
      Alert.alert("Error", "Failed to save recipe. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  const handleCancel = () => {
    resetStore();
    router.replace(APP_ROUTES.home);
  };

  return (
    <View className="flex-1">
      {/* Modal Header */}
      <SafeAreaView edges={["top"]}>
        <ModalHeader
          title={recipeId ? "Edit Recipe" : "Create Recipe"}
          onClose={handleCancel}
        />
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 bg-background-light dark:bg-background-dark"
          contentContainerClassName="p-4 pb-32 gap-6"
          keyboardShouldPersistTaps="handled"
        >
        {/* Import Section */}
        <RecipeScraper />

        {/* Basics */}
        <FormSection title="Basics" index={1}>
          <Controller
            control={control}
            name="title"
            rules={{
              required: "Title is required",
              minLength: { value: 2, message: "Title must be at least 2 characters" },
            }}
            render={({
              field: { onChange, onBlur, value },
              fieldState: { error },
            }) => (
              <View>
                <InputField
                  title="Recipe title"
                  placeholder="Making something delicious"
                  onBlur={onBlur}
                  handleChange={onChange}
                  value={value || ""}
                />
                {error && (
                  <Text className="text-red-500 font-body text-sm mt-1">
                    {error.message}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <AutoExpandTextInput
                title="Description"
                placeholder="Add a brief description of the recipe"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ""}
                minHeight={120}
              />
            )}
          />

          <Controller
            control={control}
            name="imageUrl"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text
                  className={cn(
                    "text-foreground-light dark:text-foreground-dark font-body-medium opacity-80 mb-2",
                    isIpad() ? "text-xl" : "text-lg"
                  )}
                >
                  Image
                </Text>
                <ImageController
                  initialImage={value || ""}
                  setValueOnFormState={onChange}
                />
              </View>
            )}
          />
        </FormSection>

        {/* Recipe Content */}
        <FormSection title="Recipe Content" index={2}>
          <Controller
            control={control}
            name="ingredients"
            render={({ field: { onChange, onBlur, value } }) => (
              <AutoExpandTextInput
                title="Ingredients"
                placeholder={ingredientsPlaceholder}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ""}
                minHeight={420}
              />
            )}
          />

          <Controller
            control={control}
            name="instructions"
            render={({ field: { onChange, onBlur, value } }) => (
              <AutoExpandTextInput
                title="Instructions"
                placeholder={instructionsPlaceholder}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ""}
                minHeight={420}
              />
            )}
          />
        </FormSection>

        {/* Timing */}
        <FormSection title="Timing" index={3}>
          <View
            className={cn(
              isIpad() ? "flex-row gap-4" : "gap-5"
            )}
          >
            <View className={cn(isIpad() && "flex-1")}>
              <Controller
                control={control}
                name="prepTime"
                render={({ field: { onChange, value } }) => (
                  <CustomTimeInput
                    title="Prep Time"
                    value={value || null}
                    onChange={onChange}
                  />
                )}
              />
            </View>

            <View className={cn(isIpad() && "flex-1")}>
              <Controller
                control={control}
                name="cookTime"
                render={({ field: { onChange, value } }) => (
                  <CustomTimeInput
                    title="Cook / Bake Time"
                    value={value || null}
                    onChange={onChange}
                  />
                )}
              />
            </View>

            <View className={cn(isIpad() && "flex-1")}>
              <Controller
                control={control}
                name="restTime"
                render={({ field: { onChange, value } }) => (
                  <CustomTimeInput
                    title="Rest Time"
                    value={value || null}
                    onChange={onChange}
                  />
                )}
              />
            </View>
          </View>
        </FormSection>

        {/* Details */}
        <FormSection title="Details" index={4}>
          <View
            className={cn(
              isIpad() ? "flex-row flex-wrap gap-4" : "gap-5"
            )}
          >
            <View className={cn(isIpad() && "flex-1 min-w-[45%]")}>
              <Controller
                control={control}
                name="difficulty"
                render={({ field: { onChange, value } }) => (
                  <PopUpPicker
                    title="Difficulty"
                    options={difficulties.map((d) => d.label)}
                    types={difficulties}
                    value={value || "EASY"}
                    onSelect={onChange}
                  />
                )}
              />
            </View>

            <View className={cn(isIpad() && "flex-1 min-w-[45%]")}>
              <Controller
                control={control}
                name="servings"
                render={({ field: { onChange, value } }) => (
                  <InputField
                    title="Servings"
                    value={value?.toString() ?? ""}
                    handleChange={(text) => {
                      const parsed = text ? parseInt(text, 10) : null;
                      onChange(isNaN(parsed || 4) ? null : parsed);
                    }}
                    keyboardType="numeric"
                  />
                )}
              />
            </View>

            <View className={cn(isIpad() && "flex-1 min-w-[45%]")}>
              <Controller
                control={control}
                name="mealType"
                render={({ field: { onChange, value } }) => (
                  <PopUpPicker
                    title="Meal Type"
                    options={RECIPE_MEAL_TYPES.map((type) => type.label)}
                    types={RECIPE_MEAL_TYPES}
                    value={value || "BREAKFAST"}
                    onSelect={onChange}
                  />
                )}
              />
            </View>

            <View className={cn(isIpad() && "flex-1 min-w-[45%]")}>
              <Controller
                control={control}
                name="cuisineType"
                render={({ field: { onChange, value } }) => (
                  <ComboBox
                    title="Cuisine"
                    value={value || null}
                    onSelect={onChange}
                    types={CUISINE_TYPES}
                  />
                )}
              />
            </View>
          </View>
        </FormSection>

        {/* Extras */}
        <FormSection title="Extras" index={5}>
          <Controller
            control={control}
            name="equipment"
            render={({ field: { onChange, value } }) => (
              <AutoExpandTextInput
                title="Utensils and Equipment"
                placeholder="Add utensils and equipment"
                value={value || ""}
                onChangeText={onChange}
                minHeight={120}
                maxHeight={240}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <AutoExpandTextInput
                title="Notes"
                value={value || ""}
                onChangeText={onChange}
                minHeight={120}
                maxHeight={240}
              />
            )}
          />
        </FormSection>

        {/* Settings */}
        <FormSection title="Settings" index={6}>
          <Controller
            control={control}
            name="isPublic"
            render={({ field: { onChange, value } }) => (
              <SwitchInput
                title="Make recipe public"
                value={value ?? false}
                onChange={onChange}
              />
            )}
          />
        </FormSection>

        {/* Delete (edit mode only) */}
        {recipeID && (
          <View className="mt-2">
            <DeleteRecipe recipeId={recipeID} />
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Footer */}
      <FormFooter
        onCancel={handleCancel}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
        submitLabel={recipeID ? "Update Recipe" : "Create Recipe"}
      />
    </View>
  );
};

const ingredientsPlaceholder = "1 cup flour \n2 eggs \n3 tbsp sugar";
const instructionsPlaceholder = "1. Mix ingredients \n2. Bake \n3. Serve";
