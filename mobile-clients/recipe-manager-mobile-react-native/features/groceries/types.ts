import { GroceryItem } from "@/lib/types";

export interface GroceryListSection {
  title: string;
  emoji: string;
  data: GroceryItem[];
  type: "active" | "completed";
  toggleShowCompleted?: () => void;
  isShowCompleted?: boolean;
}
