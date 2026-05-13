"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { parseGroceryItemInput } from "@/lib/functions/parse-grocery-item-input";
import { useAddInventoryItem } from "@/features/inventory/hooks/inventory-query-hooks";
import { useInventoryStore } from "@/features/inventory/stores/inventory-store";

export default function AddInventoryInput() {
  const { inputValue, setInputValue } = useInventoryStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const addMutation = useAddInventoryItem();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const parsed = parseGroceryItemInput(inputValue);
    if (!parsed) return;

    addMutation.mutate({
      name: parsed.name,
      quantity: parsed.quantity ?? null,
      quantityUnit: parsed.quantityUnit ?? null,
    });
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Add an item to your kitchen…"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-full px-4 py-2 pr-24 h-12 border border-border bg-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground"
      />
      <Button
        type="submit"
        disabled={addMutation.isPending || !inputValue.trim()}
        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-foreground hover:bg-foreground/90 rounded-md px-4 py-2 transition-opacity duration-200"
      >
        <span className="text-background text-sm font-medium">
          {addMutation.isPending ? "Adding…" : "Add"}
        </span>
      </Button>
    </form>
  );
}
