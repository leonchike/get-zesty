"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCookbooksAction } from "../actions/cookbook-actions";
import CookbookCard from "./cookbook-card";
import { SkeletonGrid } from "@/components/ui/skeleton-grid";
import { m } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/motion/transitions";
import { BookOpen } from "lucide-react";
import type { CookbookSortField } from "../types/cookbook-sort";

interface CookbookListProps {
  sort?: CookbookSortField;
  search?: string;
}

export default function CookbookList({ sort = "title-asc", search = "" }: CookbookListProps) {
  const { data: cookbooks, isLoading } = useQuery({
    queryKey: ["cookbooks", sort, search],
    queryFn: () => fetchCookbooksAction({ sort, search }),
  });

  if (isLoading) {
    return <SkeletonGrid count={4} />;
  }

  if (!cookbooks || cookbooks.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">
          No cookbooks yet. Use the CLI to ingest a cookbook.
        </p>
      </div>
    );
  }

  return (
    <m.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {cookbooks.map((cookbook) => (
        <m.div key={cookbook.id} variants={staggerItem}>
          <CookbookCard cookbook={cookbook} />
        </m.div>
      ))}
    </m.div>
  );
}
