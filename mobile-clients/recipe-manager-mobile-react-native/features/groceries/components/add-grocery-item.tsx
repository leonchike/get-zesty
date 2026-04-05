import React from "react";
import { View } from "react-native";
import InputField from "@/components/input-field";
import CustomButton from "@/components/custom-button";
import { useDeviceType } from "@/hooks/useDeviceType";
import { cn } from "@/lib/helpers/cn";

// haptics

// actions
import { useAddGroceryItem } from "../hooks/grocery-query-hooks";
import { parseGroceryItemInput } from "@/lib/helpers/parse-grocery-item";

// stores
import { useGroceryStore } from "../stores/grocery-store";

export default function AddGroceryItem() {
  const { isIPhone16Pro, isIpad } = useDeviceType();
  // const [name, setName] = useState("");
  const { inputValue, setInputValue } = useGroceryStore();

  const { mutate: addGroceryItem, isPending } = useAddGroceryItem();

  const isDisabled = !inputValue || isPending;

  const handleAdd = () => {
    if (!inputValue) return;

    const parsedItem = parseGroceryItemInput(inputValue);

    addGroceryItem({
      name: parsedItem.name,
      quantity: parsedItem.quantity ?? null,
      quantityUnit: parsedItem.quantityUnit ?? null,
    });

    setInputValue("");
  };

  return (
    <View className="flex-row items-center gap-2 mb-4">
      <View className="flex-1">
        <InputField
          value={inputValue}
          handleChange={(value) => setInputValue(value)}
          placeholder="Add a new grocery item"
          returnKeyType="go"
          onSubmitEditing={handleAdd}
        />
      </View>
      <CustomButton
        handlePress={handleAdd}
        variant="accent"
        isLoading={isPending}
        isDisabled={isDisabled}
        containerStyles={cn(isIpad() ? "px-5 py-3" : isIPhone16Pro() ? "px-3 py-2" : "px-4 py-2")}
      >
        Add
      </CustomButton>
    </View>
  );
}
