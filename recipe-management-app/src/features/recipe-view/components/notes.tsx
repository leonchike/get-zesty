import { Recipe } from "@prisma/client";
import { SectionHeader } from "@/features/recipe-view/components/list-item";
import EmptyRecipeSectionState from "@/features/recipe-view/components/empty-state";

export default function Notes({ recipe }: { recipe: Recipe }) {
  const { notes } = recipe;

  return (
    <div className="space-y-4">
      <SectionHeader emoji="📝" title="Notes" />
      <div className="">
        {notes && (
          <div className="text-sm tracking-wide leading-6 whitespace-pre-line">
            {notes}
          </div>
        )}
        {!notes && <EmptyRecipeSectionState message="No notes found" />}
      </div>
    </div>
  );
}
