"use client";

import React, { useState, ReactNode } from "react";
import SortDropdown from "@/features/groceries/components/item-sort";
import GroceryItem from "@/features/groceries/components/grocery-item";
import { useGroceryListLogic } from "@/features/groceries/hooks/useGroceryListLogic";
import { getSectionEmoji } from "@/features/groceries/constants/grocery-sections";
import { Button } from "@/components/ui/button";
import { m, AnimatePresence } from "framer-motion";

export default function ListView() {
  const {
    sortBy,
    setSortBy,
    error,
    groupedActiveItems,
    completedItems,
  } = useGroceryListLogic();

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="py-6">
      <div className="mb-4">
        <SortDropdown sortBy={sortBy} onSortChange={setSortBy} />
      </div>
      {/* Active Items */}
      <AnimatePresence mode="popLayout">
        {Object.entries(groupedActiveItems).map(([section, sectionItems]) => (
          <m.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="pt-6 pb-2 font-heading text-lg font-medium text-foreground select-none flex items-center gap-3">
              <span className="text-2xl">{getSectionEmoji(section)}</span>
              <span className="relative">
                {section}
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-accent rounded-full" />
              </span>
            </h2>
            <ul className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {sectionItems.map((item) => (
                  <m.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GroceryItem item={item} />
                  </m.li>
                ))}
              </AnimatePresence>
            </ul>
          </m.div>
        ))}
      </AnimatePresence>

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <ToggleableSection title="Completed">
          <ul className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {completedItems
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                )
                .map((item) => (
                  <m.li
                    key={item.id}
                    className="text-muted-foreground"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GroceryItem item={item} />
                  </m.li>
                ))}
            </AnimatePresence>
          </ul>
        </ToggleableSection>
      )}
    </div>
  );
}

interface ToggleableSectionProps {
  title: string;
  children: ReactNode;
  initiallyVisible?: boolean;
}

function ToggleableSection({
  title,
  children,
  initiallyVisible = false,
}: ToggleableSectionProps) {
  const [isVisible, setIsVisible] = useState(initiallyVisible);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-heading text-xl font-medium select-none">{title}</h2>
        <Button
          onClick={() => setIsVisible(!isVisible)}
          variant="link"
          className="text-sm text-muted-foreground pr-0"
        >
          {isVisible ? `Hide ${title}` : `Show ${title}`}
        </Button>
      </div>
      <AnimatePresence>
        {isVisible && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
