import { redirect } from "next/navigation";
import { getRecipeById } from "@/features/create-edit-recipe/actions/get-recipe";
import RecipeForm from "@/features/create-edit-recipe/components/recipe-form";
import { H1 } from "@/components/ui/typography";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { MoreMenu } from "@/features/create-edit-recipe/components/edit-menu";
import ROUTES from "@/lib/constants/routes";

export default async function EditRecipe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect(ROUTES.LOGIN);
  }
  const recipe = await getRecipeById(id);

  if (!recipe) {
    redirect(ROUTES.RECIPES);
  }

  return (
    <div className="m-auto max-w-3xl">
      <div className="flex justify-between">
        <H1>Edit Recipe</H1>
        <MoreMenu id={id} />
      </div>
      <div className="flex flex-wrap gap-4"></div>
      <RecipeForm initialRecipe={recipe} />
    </div>
  );
}
