import { H1 } from "@/components/ui/typography";
import AddInventoryInput from "@/features/inventory/components/add-inventory-input";
import InventoryListView from "@/features/inventory/components/inventory-list-view";

export default async function InventoryPage() {
  return (
    <div className="m-auto max-w-4xl">
      <H1>Inventory</H1>
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        What&apos;s in your pantry, fridge, and freezer.
      </p>
      <AddInventoryInput />
      <InventoryListView />
    </div>
  );
}
