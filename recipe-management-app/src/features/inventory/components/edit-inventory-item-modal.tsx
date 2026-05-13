"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useDiscardInventoryItem,
  useConsumeInventoryItem,
  useInventoryLocationsQuery,
} from "@/features/inventory/hooks/inventory-query-hooks";
import type { InventoryItemWithRelations } from "@/features/inventory/types";

interface Props {
  item: InventoryItemWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

function toDateInputValue(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function EditInventoryItemModal({
  item,
  isOpen,
  onClose,
}: Props) {
  const [name, setName] = React.useState(item.name);
  const [quantity, setQuantity] = React.useState(item.quantity?.toString() ?? "");
  const [quantityUnit, setQuantityUnit] = React.useState(item.quantityUnit ?? "");
  const [locationId, setLocationId] = React.useState(item.locationId);
  const [expiresAt, setExpiresAt] = React.useState(
    toDateInputValue(item.expiresAt)
  );
  const [notes, setNotes] = React.useState(item.notes ?? "");

  React.useEffect(() => {
    if (isOpen) {
      setName(item.name);
      setQuantity(item.quantity?.toString() ?? "");
      setQuantityUnit(item.quantityUnit ?? "");
      setLocationId(item.locationId);
      setExpiresAt(toDateInputValue(item.expiresAt));
      setNotes(item.notes ?? "");
    }
  }, [isOpen, item]);

  const updateMutation = useUpdateInventoryItem();
  const deleteMutation = useDeleteInventoryItem();
  const discardMutation = useDiscardInventoryItem();
  const consumeMutation = useConsumeInventoryItem();
  const { data: locations, isLoading } = useInventoryLocationsQuery();

  const handleSave = () => {
    updateMutation.mutate({
      id: item.id,
      name,
      quantity: quantity ? parseInt(quantity, 10) : null,
      quantityUnit: quantityUnit || null,
      locationId,
      expiresAt: expiresAt ? expiresAt : null,
      notes: notes || null,
    });
    onClose();
  };

  const handleConsume = () => {
    consumeMutation.mutate({
      id: item.id,
      decrement: (item.quantity ?? 1) + 1000,
    });
    onClose();
  };

  const handleDiscard = () => {
    discardMutation.mutate(item.id);
    onClose();
  };

  const handleDelete = () => {
    deleteMutation.mutate(item.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl bg-background w-[95vw] max-w-[500px] border border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">
            Edit Inventory Item
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="inv-name" className="md:text-right">
              Name
            </Label>
            <Input
              id="inv-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="md:col-span-3"
              autoComplete="off"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="inv-qty" className="md:text-right">
              Quantity
            </Label>
            <Input
              id="inv-qty"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="md:col-span-3"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="inv-unit" className="md:text-right">
              Unit
            </Label>
            <Input
              id="inv-unit"
              value={quantityUnit}
              onChange={(e) => setQuantityUnit(e.target.value)}
              className="md:col-span-3"
              placeholder="e.g. lb, jar, cup"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="inv-location" className="md:text-right">
              Location
            </Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="md:col-span-3">
                <SelectValue placeholder="Pick a location" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading…
                  </SelectItem>
                ) : (
                  locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.emoji ? `${loc.emoji} ` : ""}
                      {loc.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="inv-expires" className="md:text-right">
              Expires
            </Label>
            <div className="md:col-span-3 flex items-center gap-2">
              <Input
                id="inv-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="flex-1"
              />
              {expiresAt && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setExpiresAt("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-4 items-start gap-2 md:gap-4">
            <Label htmlFor="inv-notes" className="md:text-right pt-2">
              Notes
            </Label>
            <textarea
              id="inv-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="md:col-span-3 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              rows={2}
              placeholder='e.g. "opened on Tuesday"'
            />
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Permanently delete
          </Button>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleDiscard}
              className="text-foreground"
            >
              Throw out
            </Button>
            <Button variant="outline" onClick={handleConsume}>
              Mark consumed
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
