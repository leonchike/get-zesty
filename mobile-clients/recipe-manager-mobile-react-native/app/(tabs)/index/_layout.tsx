import { Stack } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

export default function RecipeStackLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Recipes",
          headerShown: false,
          animation: "slide_from_left",
        }}
      />
      <Stack.Screen
        name="recipe/[id]"
        options={{
          title: "Recipe Details",
          headerTintColor: Colors[colorScheme].tint,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="recipe/new"
        options={{
          title: "Create Recipe",
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="recipe/edit/[id]"
        options={{
          title: "Edit Recipe",
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
