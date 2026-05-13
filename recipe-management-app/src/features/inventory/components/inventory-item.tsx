"use client";

import { useState } from "react";
import clsx from "clsx";
import { Checkbox } from "@/components/ui/checkbox";
import { InventoryItemActionMenu } from "@/features/inventory/components/inventory-item-action-menu";
import { ExpiryBadge } from "@/features/inventory/components/expiry-badge";
import EditInventoryItemModal from "@/features/inventory/components/edit-inventory-item-modal";
import type { InventoryItemWithRelations } from "@/features/inventory/types";

interface Props {
  item: InventoryItemWithRelations;
}

export default function InventoryItem({ item }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const isInactive = item.status !== "ACTIVE";

  return (
    <>
      <div
        className={clsx(
          "flex items-center justify-between -my-2 py-2 -mx-4 px-4 mt-2 rounded-lg bg-surface transition-all duration-200 border border-transparent",
          !isInactive && "hover:shadow-warm-sm hover:border-border/50"
        )}
      >
        <div className="flex items-center min-w-0 flex-1">
          <InventoryItemActionMenu
            item={item}
            onEdit={() => setIsEditing(true)}
            trigger={
              <button
                type="button"
                className="mr-1 p-4 -m-4 flex items-center justify-center"
                aria-label="Item actions"
              >
                <Checkbox
                  checked={isInactive}
                  className="rounded-full pointer-events-none border-border"
                />
              </button>
            }
          />
          <div className="min-w-0">
            <div className="flex gap-3 flex-wrap items-center">
              <div
                className={clsx(
                  "font-medium text-foreground truncate",
                  isInactive && "line-through opacity-60"
                )}
              >
                {item.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {item.quantity != null && <span>{item.quantity}</span>}{" "}
                {item.quantityUnit && <span>{item.quantityUnit}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {item.recipe?.title && (
                <span className="text-xs text-muted-foreground italic">
                  from {item.recipe.title}
                </span>
              )}
              {item.notes && (
                <span className="text-xs text-muted-foreground">
                  {item.notes}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 pl-3">
          <ExpiryBadge expiresAt={item.expiresAt} />
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
      <EditInventoryItemModal
        item={item}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </>
  );
}
