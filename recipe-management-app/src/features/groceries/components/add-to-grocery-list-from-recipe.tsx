"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/reusable-modal-v2";
import { useAddIngredientsStore } from "@/features/groceries/stores/add-ingredients-store";
import { ParsedIngredient } from "@/lib/types/types";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/features/recipe-view/components/list-item";
interface AddIngredientsToGroceryListProps {
  id: string | null;
  initialIngredients: ParsedIngredient[];
  scale: number;
}

export default function AddIngredientsToGroceryList({
  id,
  initialIngredients,
  scale,
}: AddIngredientsToGroceryListProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [isAllSelected, setIsAllSelected] = useState(true);

  const {
    ingredients,
    setIngredients,
    toggleIngredient,
    selectAll,
    deselectAll,
    handleAddToGroceryList,
    loading,
    error,
  } = useAddIngredientsStore();

  const toggleSelectAll = () => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
    setIsAllSelected(!isAllSelected);
  };

  useEffect(() => {
    if (isOpen && initialIngredients) {
      const selectedAndScaledIngredients = initialIngredients.map((ing) => ({
        ...ing,
        name: ing.ingredient,
        quantity: (ing.quantity || 0) * scale,
        quantityUnit: ing.unit,
        selected: true,
      }));
      setIngredients(selectedAndScaledIngredients);
    }
  }, [isOpen, initialIngredients, scale, setIngredients]);

  const handleAddToList = async () => {
    const success = await handleAddToGroceryList(id);
    if (success) {
      toast("Groceries added to list", {
        action: {
          label: "Go to grocery list",
          onClick: () => {
            router.push("/groceries");
          },
        },
      });

      // Invalidate the grocery items query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["groceryItems"] });

      // Close the modal after 200ms
      const timeoutId = setTimeout(() => {
        setIsOpen(false);
      }, 200);
      // Clean up the timeout if the component unmounts
      return () => clearTimeout(timeoutId);
    } else {
      toast.error("Failed to add ingredients to grocery list");
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="border-border hover:bg-primary/5"
      >
        Add to grocery list
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title=""
        className="border-none"
      >
        <div className="">
          <div className="pb-3">
            <SectionHeader emoji="🛒" title="Add to grocery list" />
          </div>
          <div className="max-h-[70vh] overflow-y-auto mt-4 mb-16">
            <div className="space-y-4">
              {ingredients.map((ing, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 cursor-pointer select-none"
                  onClick={() => toggleIngredient(index)}
                >
                  <Checkbox
                    checked={ing.selected}
                    // onCheckedChange={() => toggleIngredient(index)}
                    className={cn(
                      "rounded-full",
                      "border-border",
                      "data-[state=checked]:text-background",
                      "data-[state=checked]:bg-foreground",
                      "data-[state=checked]:border-foreground"
                    )}
                  />
                  <span>
                    {ing?.quantity !== 0 && `${ing?.quantity} `}
                    {ing?.unit} {ing?.ingredient}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-2">
              {error && <p className="text-red-500">{error}</p>}
            </div>
          </div>
          <div className="fixed bottom-6 left-0 px-6 w-full bg-background pt-6">
            <div className="flex justify-between">
              <div className="">
                <Button
                  onClick={toggleSelectAll}
                  variant="outline"
                  className="border-border"
                >
                  {isAllSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div>
                <Button
                  onClick={handleAddToList}
                  disabled={loading}
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? "Adding..." : "Add to Grocery List"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
