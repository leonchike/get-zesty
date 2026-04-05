"use client";

import React from "react";
import Image from "next/image";
import { Recipe } from "@prisma/client";
import { formatImageUrl } from "@/lib/image-upload/cloudflare-images";

export default function RecipeImage({ recipe }: { recipe: Recipe }) {
  const { imageUrl } = recipe;
  const formattedUrl = formatImageUrl(imageUrl);

  if (!formattedUrl) return null;

  return (
    <div className="w-full h-[15rem] md:h-[20rem] lg:h-[28rem] xl:h-[30rem] relative rounded-xl rounded-3xl overflow-hidden">
      <Image
        src={formattedUrl}
        alt={recipe.title || "Recipe image"}
        fill={true}
        style={{ objectFit: "cover" }}
        unoptimized
      />
    </div>
  );
}
