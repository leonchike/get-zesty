"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  useConsumeInventoryItem,
  useDiscardInventoryItem,
} from "@/features/inventory/hooks/inventory-query-hooks";
import type { InventoryItemWithRelations } from "@/features/inventory/types";

interface Props {
  item: InventoryItemWithRelations;
  trigger: React.ReactNode;
  onEdit: () => void;
}

export function InventoryItemActionMenu({ item, trigger, onEdit }: Props) {
  const [open, setOpen] = useState(false);
  const consumeMutation = useConsumeInventoryItem();
  const discardMutation = useDiscardInventoryItem();

  const hasQuantity = typeof item.quantity === "number" && item.quantity > 1;

  const close = () => setOpen(false);

  const consumeOne = () => {
    consumeMutation.mutate({ id: item.id, decrement: 1 });
    close();
  };
  const markConsumed = () => {
    consumeMutation.mutate({
      id: item.id,
      decrement: (item.quantity ?? 1) + 1000,
    });
    close();
  };
  const discard = () => {
    discardMutation.mutate(item.id);
    close();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-1 bg-surface border border-border"
      >
        <div className="flex flex-col">
          {hasQuantity && (
            <Button
              variant="ghost"
              className="justify-start text-sm font-normal"
              onClick={consumeOne}
            >
              Consume one
            </Button>
          )}
          <Button
            variant="ghost"
            className="justify-start text-sm font-normal"
            onClick={markConsumed}
          >
            Mark consumed
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-sm font-normal"
            onClick={discard}
          >
            Throw out
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-sm font-normal"
            onClick={() => {
              close();
              onEdit();
            }}
          >
            Edit
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
