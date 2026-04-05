import { H1 } from "@/components/ui/typography";
import AddGroceryInput from "@/features/groceries/components/input";
import ListView from "@/features/groceries/components/list-view";

export default async function Groceries() {
  return (
    <div className="m-auto max-w-4xl">
      <H1>Groceries</H1>
      <div>
        <AddGroceryInput />
        <ListView />
      </div>
    </div>
  );
}
