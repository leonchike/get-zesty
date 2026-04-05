"use client";

import React, { useRef } from "react";
import {
  useAddGroceryItem,
  CreateGroceryItemInput,
} from "@/features/groceries/hooks/grocery-query-hooks";
import { Button } from "@/components/ui/button";
import { parseGroceryItemInput } from "@/lib/functions/parse-grocery-item-input";
import { useGroceryStore } from "@/features/groceries/stores/grocery-store";

export default function AddGroceryInput() {
  const { inputValue, setInputValue } = useGroceryStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const addItemMutation = useAddGroceryItem();

  const handleItemName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue === "") return;

    const parsedItem = parseGroceryItemInput(inputValue);
    if (parsedItem) {
      const newItem: CreateGroceryItemInput = {
        name: parsedItem.name,
        quantity: parsedItem.quantity ?? null,
        quantityUnit: parsedItem.quantityUnit ?? null,
      };
      addItemMutation.mutate(newItem);
      setInputValue("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Add a new grocery item"
        value={inputValue}
        onChange={handleItemName}
        className="w-full px-4 py-2 pr-24 h-12 border border-border bg-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground"
      />
      <Button
        disabled={addItemMutation.isPending || inputValue === ""}
        type="submit"
        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-foreground hover:bg-foreground/90 rounded-md px-4 py-2 transition-opacity duration-200"
      >
        <span className="text-background text-sm font-medium">
          {addItemMutation.isPending ? "Adding..." : "Add"}
        </span>
      </Button>
    </form>
  );
}
