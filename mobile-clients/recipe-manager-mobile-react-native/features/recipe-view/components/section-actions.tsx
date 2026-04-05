import { Text, View, Image, Pressable, TouchableOpacity } from "react-native";
import clsx from "clsx";
import { useRouter } from "expo-router";

// types
import { Recipe } from "@/lib/types";

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";
import { useColorScheme } from "react-native";
import { useAuth } from "@/context/AuthContext";
import {
  usePinnedRecipes,
  useTogglePinnedRecipe,
} from "@/features/pinned-recipes/hooks/use-pinned-recipes";

// lib
import { recipeOwnershipType } from "../lib/recipe-ownership-type";

// constants
import { horizontalPaddingValue } from "@/components/view-wrapper";
import icons from "@/constants/icons";

// stores
import useUIStore from "@/stores/global-ui-store";
import { useRecipeModalStore } from "@/stores/recipe-modal-store";

export function SectionEditStartCooking({
  recipe,
}: {
  recipe: Recipe | undefined;
}) {
  const { user } = useAuth();
  const { isAuthenticated } = useAuth();

  if (!recipe) return null;
  const { id, userId } = recipe;

  const isOwnRecipe = recipeOwnershipType(user?.id, userId);

  return (
    <View
      className={clsx(
        "flex-row items-center gap-3 pt-6",
        horizontalPaddingValue
      )}
    >
      {isAuthenticated && isOwnRecipe && <EditButton id={id} />}
      <StartCookingButton recipe={recipe} />
    </View>
  );
}

function EditButton({ id }: { id: string }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { closeRecipe } = useRecipeModalStore();

  const handleEdit = (recipeId: string) => {
    closeRecipe();
    setTimeout(() => {
      // @ts-ignore
      router.push(`recipe/edit/${recipeId}`);
    }, 100);
  };

  return (
    <Pressable
      onPress={() => handleEdit(id)}
      className={clsx(
        "px-5 py-2.5 rounded-xl",
        "border",
        "border-border-light dark:border-border-dark",
        "active:opacity-70"
      )}
    >
      <Text className="font-body-semibold text-foreground-light dark:text-foreground-dark text-base">
        Edit
      </Text>
    </Pressable>
  );
}

function StartCookingButton({ recipe }: { recipe: Recipe }) {
  const setCookingExperienceModalVisible = useUIStore(
    (state) => state.setCookingExperienceModalVisible
  );
  const setSelectedRecipeForCookingExperience = useUIStore(
    (state) => state.setSelectedRecipeForCookingExperience
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        setSelectedRecipeForCookingExperience(recipe);
        setCookingExperienceModalVisible(true);
      }}
      className={clsx(
        "flex-1 items-center justify-center",
        "py-3.5 rounded-xl",
        "bg-primary-light"
      )}
    >
      <Text className="font-body-semibold text-white text-base">
        Start Cooking
      </Text>
    </TouchableOpacity>
  );
}

export function SectionPinFavorite({ recipe }: { recipe: Recipe | undefined }) {
  if (!recipe) return null;

  return (
    <View
      className={clsx(
        "flex-row items-center gap-3 pt-6",
        horizontalPaddingValue
      )}
    >
      <PinButton recipe={recipe} />
    </View>
  );
}

function PinButton({ recipe }: { recipe: Recipe }) {
  const colorScheme = useColorScheme();
  const { data: pinnedRecipes } = usePinnedRecipes();
  const { mutate: togglePinnedRecipe } = useTogglePinnedRecipe();
  const isPinned = pinnedRecipes?.some((r) => r.id === recipe.id);

  // Saffron accent for pinned state, warm neutral for unpinned
  const tintColor = isPinned
    ? "#F0960A"
    : colorScheme === "dark"
    ? "#A8A29E"
    : "#78716C";

  return (
    <Pressable
      onPress={() => togglePinnedRecipe(recipe.id)}
      className="items-center justify-center rounded-xl px-4 py-2 border border-border-light dark:border-border-dark"
    >
      <Image
        tintColor={tintColor}
        source={icons.pinIcon}
        className="w-4 h-6"
        style={{ transform: [{ rotate: "20deg" }], tintColor }}
      />
    </Pressable>
  );
}
