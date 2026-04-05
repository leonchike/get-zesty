import { Recipe } from "@prisma/client";
import { splitRecipeStringCommaSemicolon } from "@/lib/functions/split-recipe-string";
import {
  SectionHeader,
  ToggleableItem,
} from "@/features/recipe-view/components/list-item";
import EmptyRecipeSectionState from "@/features/recipe-view/components/empty-state";

export default function Equipment({ recipe }: { recipe: Recipe }) {
  const { equipment } = recipe;

  return (
    <div className="space-y-4">
      <SectionHeader emoji="🍴" title="Equipment" />
      <div className="">
        {equipment ? (
          <DisplayItems items={equipment} />
        ) : (
          <EmptyRecipeSectionState message="No equipment found" />
        )}
      </div>
    </div>
  );
}

function DisplayItems({ items }: { items: string | null }) {
  if (!items) return null;

  const itemsArray = splitRecipeStringCommaSemicolon(items) as string[];

  return (
    <div className="space-y-1">
      {itemsArray.map((item, index) => (
        <ToggleableItem key={index}>
          <span className="tracking-wide leading-6">{item}</span>
        </ToggleableItem>
      ))}
    </div>
  );
}
