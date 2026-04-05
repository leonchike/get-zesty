"use client";

import { Recipe } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { capitalizeWords } from "@/lib/helpers/text-helpers";
export default function Tags({ recipe }: { recipe: Recipe }) {
  const { isPublic, tags, cuisineType, mealType } = recipe;

  return (
    <div className="flex flex-wrap gap-2 opacity-80 select-none">
      {isPublic ? (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline">Available to all</Badge>
          </TooltipTrigger>
          <TooltipContent>This recipe is available to all</TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline">Only you can see this</Badge>
          </TooltipTrigger>
          <TooltipContent>This recipe is only visible to you</TooltipContent>
        </Tooltip>
      )}

      {cuisineType && (
        <Badge variant="outline">{capitalizeWords(cuisineType)}</Badge>
      )}

      {mealType && (
        <Badge variant="outline">{capitalizeWords(mealType, true)}</Badge>
      )}

      {tags.map((tag, index) => (
        <Badge key={index} variant="outline">
          {tag}
        </Badge>
      ))}
    </div>
  );
}
