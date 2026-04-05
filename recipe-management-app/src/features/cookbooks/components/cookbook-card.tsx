"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import ROUTES from "@/lib/constants/routes";
import { m } from "framer-motion";
import { cardHover } from "@/components/motion/transitions";

interface CookbookCardProps {
  cookbook: {
    id: string;
    title: string;
    author: string | null;
    publisher: string | null;
    year: number | null;
    recipeCount: number;
    coverUrl: string | null;
  };
}

export default function CookbookCard({ cookbook }: CookbookCardProps) {
  const { id, title, author, publisher, year, recipeCount, coverUrl } =
    cookbook;

  const subtitle = [author, publisher, year].filter(Boolean).join(" · ");

  return (
    <m.div variants={cardHover} initial="rest" whileHover="hover">
      <Link href={`${ROUTES.COOKBOOKS}/${id}`}>
        <article className="overflow-hidden rounded-xl bg-surface border border-border/50 shadow-warm-sm hover:shadow-warm-md transition-shadow duration-200">
          <div className="relative h-48 2xl:h-64 overflow-hidden">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={title}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <BookOpen className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
            <span className="absolute top-2 left-2 bg-accent/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-white">
              {recipeCount} {recipeCount === 1 ? "recipe" : "recipes"}
            </span>
          </div>
          <div className="p-3 space-y-1">
            <h2 className="font-heading font-medium text-base truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground text-xs truncate">
                {subtitle}
              </p>
            )}
          </div>
        </article>
      </Link>
    </m.div>
  );
}
