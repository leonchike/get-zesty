"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import debounce from "lodash/debounce";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import CookbookSearch from "./cookbook-search";
import CookbookRecipeList from "./cookbook-recipe-list";
import DeleteCookbookDialog from "./delete-cookbook-dialog";
import ROUTES from "@/lib/constants/routes";

interface CookbookDetailProps {
  cookbook: {
    id: string;
    title: string;
    author: string | null;
    publisher: string | null;
    year: number | null;
    description: string | null;
    recipeCount: number;
    totalPages: number | null;
    coverUrl: string | null;
  };
}

export default function CookbookDetail({ cookbook }: CookbookDetailProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const debouncedSetSearch = useCallback(
    debounce((value: string) => setDebouncedSearch(value), 300),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSetSearch(value);
  };

  const subtitle = [cookbook.author, cookbook.publisher, cookbook.year]
    .filter(Boolean)
    .join(" · ");

  const stats = [
    { label: "Recipes", value: cookbook.recipeCount },
    cookbook.totalPages ? { label: "Pages", value: cookbook.totalPages } : null,
  ].filter(Boolean);

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link
          href={ROUTES.COOKBOOKS}
          className="hover:text-foreground transition-colors"
        >
          Cookbooks
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate">{cookbook.title}</span>
      </nav>

      {/* Header */}
      <div className="flex gap-6 mb-6">
        {/* Cover image */}
        <div className="flex-shrink-0 w-32 h-44 md:w-40 md:h-56 relative rounded-xl overflow-hidden shadow-warm-md">
          {cookbook.coverUrl ? (
            <Image
              src={cookbook.coverUrl}
              alt={cookbook.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <BookOpen className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h1 className="font-heading text-2xl md:text-3xl font-medium break-words tracking-tight">
                {cookbook.title}
              </h1>
              <DeleteCookbookDialog
                cookbookId={cookbook.id}
                cookbookTitle={cookbook.title}
                recipeCount={cookbook.recipeCount}
              />
            </div>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
            {cookbook.description && (
              <p className="text-foreground/70 mt-3 text-sm line-clamp-3 leading-relaxed">
                {cookbook.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="flex gap-4 mb-6">
          {stats.map(
            (stat) =>
              stat && (
                <div
                  key={stat.label}
                  className="text-sm bg-surface border border-border/50 rounded-lg px-3 py-1.5"
                >
                  <span className="text-muted-foreground">
                    {stat.label}:
                  </span>{" "}
                  <span className="font-medium">{stat.value}</span>
                </div>
              )
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-6 max-w-md">
        <CookbookSearch value={search} onChange={handleSearchChange} />
      </div>

      {/* Recipe list */}
      <CookbookRecipeList cookbookId={cookbook.id} search={debouncedSearch} />
    </div>
  );
}
