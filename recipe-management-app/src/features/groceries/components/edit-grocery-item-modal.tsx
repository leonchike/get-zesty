"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUpdateGroceryItem,
  useDeleteGroceryItem,
  useGrocerySectionsQuery,
} from "@/features/groceries/hooks/grocery-query-hooks";
import { GroceryItemWithSection } from "@/features/groceries/hooks/grocery-query-hooks";

interface EditGroceryItemModalProps {
  item: GroceryItemWithSection;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditGroceryItemModal({
  item,
  isOpen,
  onClose,
}: EditGroceryItemModalProps) {
  const [name, setName] = React.useState(item.name);
  const [quantity, setQuantity] = React.useState(
    item.quantity?.toString() || ""
  );
  const [quantityUnit, setQuantityUnit] = React.useState(
    item.quantityUnit || ""
  );
  const [sectionId, setSectionId] = React.useState(item.sectionId || "");

  const updateMutation = useUpdateGroceryItem();
  const deleteMutation = useDeleteGroceryItem();
  const { data: sections, isLoading: isSectionsLoading } =
    useGrocerySectionsQuery();

  const handleUpdate = () => {
    updateMutation.mutate({
      id: item.id,
      name,
      quantity: quantity ? parseInt(quantity, 10) : null,
      quantityUnit: quantityUnit || null,
      sectionId: sectionId || null,
    });
    onClose();
  };

  const handleDelete = () => {
    deleteMutation.mutate(item.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl bg-pageBg-light dark:bg-pageBg-dark w-[95vw] max-w-[500px] border-none">
        <DialogHeader>
          <DialogTitle className="text-textColor-light dark:text-textColor-dark">
            Edit Grocery Item
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label
              htmlFor="item-name"
              className="md:text-right text-textColor-light dark:text-textColor-dark"
            >
              Name
            </Label>
            <Input
              id="item-name"
              name="item-name"
              value={name}
              onChange={(e: {
                target: { value: React.SetStateAction<string> };
              }) => setName(e.target.value)}
              className="md:col-span-3"
              autoComplete="off"
              data-1p-ignore
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label
              htmlFor="quantity"
              className="md:text-right text-textColor-light dark:text-textColor-dark"
            >
              Quantity
            </Label>
            <Input
              id="quantity"
              value={quantity}
              onChange={(e: {
                target: { value: React.SetStateAction<string> };
              }) => setQuantity(e.target.value)}
              className="md:col-span-3"
              type="number"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label
              htmlFor="unit"
              className="md:text-right text-textColor-light dark:text-textColor-dark"
            >
              Unit
            </Label>
            <Input
              id="unit"
              value={quantityUnit}
              onChange={(e: {
                target: { value: React.SetStateAction<string> };
              }) => setQuantityUnit(e.target.value)}
              className="md:col-span-3"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label
              htmlFor="section"
              className="md:text-right text-textColor-light dark:text-textColor-dark"
            >
              Section
            </Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger className="md:col-span-3">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {isSectionsLoading ? (
                  <SelectItem value="loading">Loading sections...</SelectItem>
                ) : (
                  sections?.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2 flex-row">
          <Button
            variant="outline"
            onClick={handleDelete}
            className="hover:bg-red-500 dark:hover:bg-red-700 hover:text-white transition-colors bg-transparent dark:text-textColor-dark"
          >
            Delete
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-pageBg-dark dark:bg-pageBg-light dark:text-textColor-light"
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
