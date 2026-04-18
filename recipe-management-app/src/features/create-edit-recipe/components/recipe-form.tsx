// src/components/recipes-view/recipe-form.tsx
"use client";

import React from "react";
import { Recipe } from "@prisma/client";
import {
  useRecipeForm,
  RecipeFormInputs,
} from "@/features/create-edit-recipe/hooks/useRecipeForm";
import ImageFormState from "@/features/create-edit-recipe/components/image-upload/image-form-state";
import { useRecipeStore } from "@/features/create-edit-recipe/stores/recipe-form-store";
import { AutoExpandTextarea } from "@/components/ui/expandable-input";
import CustomTimeInput from "@/components/ui/input-custom-time";
import { LargeRadioInput } from "@/components/ui/radio-input-large";
import { NumberField } from "@/components/ui/number-field";
import { Combobox } from "@/components/ui/combo-box-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CUISINE_TYPES, RECIPE_MEAL_TYPES } from "@/lib/constants/temp-data";

import { useImageUploadStore } from "@/features/create-edit-recipe/stores/recipe-form-image-upload-store";

type RecipeFormProps = {
  initialRecipe?: Recipe;
};

const RecipeForm: React.FC<RecipeFormProps> = ({ initialRecipe }) => {
  const { form, onSubmit, reset } = useRecipeForm(initialRecipe);
  const { isSubmitting, setRecipeID, reset: resetStore } = useRecipeStore();
  const {
    register,
    formState: { errors },
    setValue,
    control,
  } = form;

  React.useEffect(() => {
    if (initialRecipe) {
      setRecipeID(initialRecipe.id);
    }
  }, [initialRecipe, reset, setRecipeID, setValue]);

  // Reset the form when the component unmounts
  React.useEffect(() => {
    return () => {
      console.log(
        "Cleanup function called - component is unmounting or re-mounting"
      );
      resetStore();
      setValue("imageUrl", "");
    };
  }, [resetStore, setValue]);

  // Reset the form when the initialRecipe changes
  React.useEffect(() => {
    if (initialRecipe) {
      // Set the initial image when editing an existing recipe
      setValue("imageUrl", initialRecipe.imageUrl || "");
      useImageUploadStore.getState().setImageUrl(initialRecipe.imageUrl || "");
    } else {
      // Clear everything when creating a new recipe
      form.reset();
      resetStore();
      setValue("imageUrl", "");
      useImageUploadStore.getState().reset();
    }
  }, [initialRecipe, form, resetStore, setValue]);

  return (
    <div className="py-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form.getValues());
        }}
        className="space-y-4 md:space-y-6"
      >
        <div>
          <Label htmlFor="title" className="">
            Title
          </Label>
          <Input
            type="text"
            id="title"
            placeholder="Enter the title of the recipe"
            {...register("title")}
            className="ring-offset-0"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          {/* Ingredients */}
          <Label htmlFor="ingredients">Ingredients</Label>
          <AutoExpandTextarea
            id="ingredients"
            placeholder="Add ingredients of the recipe"
            minHeight="120px"
            {...register("ingredients")}
          />
          {errors.ingredients && (
            <p className="mt-1 text-sm text-red-6000">
              {errors.ingredients.message}
            </p>
          )}
        </div>

        <div>
          {/* Instructions */}
          <Label htmlFor="instructions">Instructions</Label>
          <FormSubLabel>
            No need to add numbers, simply break into paragraphs.
          </FormSubLabel>
          <AutoExpandTextarea
            id="instructions"
            placeholder={`Step 1: Prepare ingredients\nStep 2: Mix dry ingredients\nStep 3: Add wet ingredients\n...`}
            minHeight="180px"
            className="placeholder:whitespace-pre-line"
            {...register("instructions")}
          />
          {errors.instructions && (
            <p className="mt-1 text-sm text-red-6000">
              {errors.instructions.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <AutoExpandTextarea
            id="description"
            // value={initialRecipe?.description || ""}
            placeholder="Add a brief description of the recipe"
            minHeight="120px"
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <ImageFormState
            imageUrl={
              form.getValues("imageUrl") || initialRecipe?.imageUrl || undefined
            }
            setValue={(value: string) => setValue("imageUrl", value)}
          />
          {errors.imageUrl && (
            <p className="mt-1 text-sm text-red-600">
              {errors.imageUrl.message}
            </p>
          )}
        </div>

        {/* Time and Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {/* Prep Time */}
          <div className="w-full sm:w-auto">
            <CustomTimeInput
              label="Prep Time"
              id="prepTime"
              value={form.getValues("prepTime") ?? null}
              onChange={(value) => setValue("prepTime", value)}
              placeholder="00:00"
            />
            {errors.prepTime && (
              <p className="mt-1 text-sm text-red-6000">
                {errors.prepTime.message}
              </p>
            )}
          </div>

          {/* Cook Time */}
          <div className="w-full sm:w-auto">
            <CustomTimeInput
              label="Cook / Bake Time"
              id="cookTime"
              value={form.getValues("cookTime") ?? null}
              onChange={(value) => setValue("cookTime", value)}
              placeholder="00:00"
            />
            {errors.cookTime && (
              <p className="mt-1 text-sm text-red-6000">
                {errors.cookTime.message}
              </p>
            )}
          </div>

          {/* Rest Time */}
          <div className="w-full sm:w-auto">
            <CustomTimeInput
              label="Rest Time"
              id="restTime"
              value={form.getValues("restTime") ?? null}
              onChange={(value) => setValue("restTime", value)}
              placeholder="00:00"
            />
            {errors.restTime && (
              <p className="mt-1 text-sm text-red-6000">
                {errors.restTime.message}
              </p>
            )}
          </div>

          {/* Difficulty */}
          <div className="w-full sm:w-auto min-w-[120px]">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              onValueChange={(value: "EASY" | "MEDIUM" | "HARD") =>
                setValue("difficulty", value)
              }
              defaultValue={form.getValues("difficulty")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
            {errors.difficulty && (
              <p className="mt-1 text-sm text-red-6000">
                {errors.difficulty.message}
              </p>
            )}
          </div>

          {/* Servings */}
          <div>
            <Label htmlFor="servings">Servings</Label>
            <NumberField
              id="servings"
              name="servings"
              control={control}
              min={1}
            />
            {errors.servings && (
              <p className="mt-1 text-sm text-red-6000">
                {errors.servings.message}
              </p>
            )}
          </div>
        </div>

        <div>
          {/* Utensils */}
          <Label htmlFor="utensils">Utensils and Equipment</Label>
          <AutoExpandTextarea
            id="equipment"
            placeholder="Add utensils and equipment of the recipe"
            minHeight="80px"
            {...register("equipment")}
          />
          {errors.equipment && (
            <p className="mt-1 text-sm text-red-6000">
              {errors.equipment.message}
            </p>
          )}
        </div>

        <div>
          {/* notes */}
          <Label htmlFor="notes">Notes</Label>
          <AutoExpandTextarea
            id="notes"
            placeholder="Add notes of the recipe"
            minHeight="120px"
            {...register("notes")}
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-6000">{errors.notes.message}</p>
          )}
        </div>

        <div>
          {/* isPublic */}
          <LargeRadioInput
            label="Set recipe as"
            options={[
              {
                value: "PRIVATE",
                label: "Private",
                description: "Only you have access to this recipe",
              },
              {
                value: "PUBLIC",
                label: "Public",
                description: "Accessible to the public",
              },
            ]}
            defaultValue={form.getValues("isPublic") ? "PUBLIC" : "PRIVATE"}
            onChange={(value) => setValue("isPublic", value === "PUBLIC")}
          />
          {errors.isPublic && (
            <p className="mt-1 text-sm text-red-6000">
              {errors.isPublic.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {/* Cuisine Type */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="cuisineType">Cuisine Type</Label>
            <Combobox
              id="cuisineType"
              control={control}
              options={CUISINE_TYPES}
              placeholder="Select cuisine type"
            />
            {errors.cuisineType && (
              <p className="mt-1 text-sm text-red-600">
                {errors.cuisineType.message}
              </p>
            )}
          </div>

          {/* Meal Type */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="mealType">Recipe Type</Label>
            <Select
              onValueChange={(value: string) => setValue("mealType", value)}
              value={form.watch("mealType") ?? ""}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select recipe type" />
              </SelectTrigger>
              <SelectContent>
                {RECIPE_MEAL_TYPES.map((mealType) => (
                  <SelectItem key={mealType.value} value={mealType.value}>
                    {mealType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mealType && (
              <p className="mt-1 text-sm text-red-600">
                {errors.mealType.message}
              </p>
            )}
          </div>
        </div>

        <div className="py-8">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? "Saving..."
              : initialRecipe
              ? "Update Recipe"
              : "Create Recipe"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;

function FormSubLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500 pb-1 select-none">{children}</p>;
}
