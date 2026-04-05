import { fetchCookbookRecipeAction } from "@/features/cookbooks/actions/cookbook-actions";
import ViewControl from "@/features/recipe-view/components/view-control";
import { adaptCookbookRecipeToDetailData } from "@/features/recipe-view/adapters";
import { cookbookRecipeConfig } from "@/features/recipe-view/types";
import NotFound from "@/components/ui/not-found";

export default async function CookbookRecipePage({
  params,
}: {
  params: Promise<{ id: string; recipeId: string }>;
}) {
  const { id, recipeId } = await params;
  const recipe = await fetchCookbookRecipeAction(recipeId);

  if (!recipe) {
    return <NotFound />;
  }

  const detailData = adaptCookbookRecipeToDetailData({
    ...recipe,
    cookbook: {
      id,
      title: recipe.cookbook.title,
      author: recipe.cookbook.author,
    },
  });

  return <ViewControl data={detailData} config={cookbookRecipeConfig} isLoggedIn={true} />;
}
