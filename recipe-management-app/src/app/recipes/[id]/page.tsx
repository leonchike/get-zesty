import { getRecipeByIdAction } from "@/features/recipe-view/actions/get-recipe";
import ViewControl from "@/features/recipe-view/components/view-control";
import { adaptRecipeToDetailData } from "@/features/recipe-view/adapters";
import { fullRecipeConfig } from "@/features/recipe-view/types";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import NotFound from "@/components/ui/not-found";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const recipe = await getRecipeByIdAction(id);

  if (!recipe) {
    return <NotFound />;
  }

  const detailData = adaptRecipeToDetailData(recipe);

  return (
    <ViewControl
      data={detailData}
      config={fullRecipeConfig}
      recipe={recipe}
      isLoggedIn={!!session}
    />
  );
}
