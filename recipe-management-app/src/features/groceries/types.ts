import { GroceryItemWithSection } from "@/features/groceries/hooks/grocery-query-hooks";

export interface GroceryListSection {
  title: string;
  emoji: string;
  data: GroceryItemWithSection[];
  type: "active" | "completed";
  toggleShowCompleted?: () => void;
  isShowCompleted?: boolean;
}
