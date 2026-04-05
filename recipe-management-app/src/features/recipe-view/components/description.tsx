import { Recipe } from "@prisma/client";
import { ReadMore } from "@/components/ui/readmore";

export default function Description({ recipe }: { recipe: Recipe }) {
  const { description } = recipe;

  if (!description) return null;

  return (
    <div className="max-w-[30rem]">
      <ReadMore lines={3}>{description}</ReadMore>
    </div>
  );
}
