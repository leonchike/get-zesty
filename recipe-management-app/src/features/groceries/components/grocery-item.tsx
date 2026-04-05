"use client";

import React from "react";
import clsx from "clsx";
import { GroceryItemWithSection } from "@/features/groceries/hooks/grocery-query-hooks";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateGroceryItem } from "@/features/groceries/hooks/grocery-query-hooks";
import EditGroceryItemModal from "@/features/groceries/components/edit-grocery-item-modal";

export default function GroceryItem({
  item,
}: {
  item: GroceryItemWithSection;
}) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const updateMutation = useUpdateGroceryItem();

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateMutation.mutate({
      id: item.id,
      status: item.status === "COMPLETED" ? "ACTIVE" : "COMPLETED",
    });
  };

  return (
    <>
      <div
        className="flex items-center justify-between -my-2 py-2 -mx-4 px-4 mt-2 cursor-pointer relative rounded-lg bg-surface hover:shadow-warm-sm transition-all duration-200 border border-transparent hover:border-border/50"
        onClick={() => setIsModalOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center">
          <div
            className="mr-1 p-4 -m-4 flex items-center justify-center"
            onClick={handleStatusToggle}
          >
            <Checkbox
              checked={item.status === "COMPLETED"}
              className="rounded-full pointer-events-none border-border"
            />
          </div>
          <div>
            <div className="flex gap-3 flex-wrap items-center">
              <div
                className={clsx(
                  "font-medium text-foreground",
                  item.status === "COMPLETED" && "line-through opacity-60"
                )}
              >
                {item.name}
              </div>
              <div
                className={clsx(
                  "text-sm text-muted-foreground",
                  item.status === "COMPLETED" && "line-through"
                )}
              >
                {item?.quantity && <span>{item.quantity}</span>}{" "}
                {item?.quantityUnit && <span>{item.quantityUnit}</span>}
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                {item.recipe?.title}
              </span>
            </div>
          </div>
        </div>
        {isHovered && (
          <div className="absolute right-3 text-sm text-muted-foreground">
            Select to Edit
          </div>
        )}
      </div>
      <EditGroceryItemModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
