import { View } from "react-native";
import { Badge } from "@/components/badge";
import { capitalizeWords } from "@/lib/helpers/text-helpers";
import clsx from "clsx";

// types
import { Recipe } from "@/lib/types";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";

// hooks
import { useAuth } from "@/context/AuthContext";

// lib
import { recipeOwnershipType } from "../lib/recipe-ownership-type";

export default function Tags({ recipe }: { recipe: Recipe | undefined }) {
  const { user } = useAuth();

  if (!recipe) return null;
  const { isPublic, tags, cuisineType, mealType, userId } = recipe;

  const isOwnRecipe = recipeOwnershipType(user?.id, userId);

  return (
    <View
      className={clsx(
        "flex-row flex-wrap items-center gap-1 pt-6",
        horizontalPaddingValue
      )}
    >
      {isOwnRecipe && <Badge variant="outline">Your recipe</Badge>}
      {!isOwnRecipe && <Badge variant="outline">Community recipe</Badge>}

      {cuisineType && (
        <Badge variant="outline">{capitalizeWords(cuisineType)}</Badge>
      )}

      {isPublic && isOwnRecipe && (
        <Badge variant="outline">Public recipe</Badge>
      )}
      {!isPublic && isOwnRecipe && (
        <Badge variant="outline">Private recipe</Badge>
      )}

      {mealType && (
        <Badge variant="outline">{capitalizeWords(mealType, true)}</Badge>
      )}

      {tags.map((tag, index) => (
        <Badge key={index} variant="outline">
          {tag}
        </Badge>
      ))}
    </View>
  );
}
