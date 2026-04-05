import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { GroceryItem } from "@/lib/types";
import { logger } from "@/lib/utils/logger";
import Checkbox from "@/components/checkbox";
import clsx from "clsx";
import EditGroceryItemModal from "./edit-grocery-item-modal";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useColorScheme } from "@/hooks/useColorScheme";

// actions
import { useUpdateGroceryItem } from "../hooks/grocery-query-hooks";

const GroceryItemComponent = ({
  item,
  isCompleted = false,
}: {
  item: GroceryItem;
  isCompleted?: boolean;
}) => {
  const { isIPhone16Pro, isIpad } = useDeviceType();
  const colorScheme = useColorScheme();
  const updateGroceryItem = useUpdateGroceryItem();

  const onPressCheckbox = () => {
    updateGroceryItem.mutate({
      id: item.id,
      status: item.status === "ACTIVE" ? "COMPLETED" : "ACTIVE",
    });
  };

  const onLongPressCheckbox = () => {
    logger.log("onLongPressCheckbox");
  };

  const itemName = item?.name || "Unnamed Item";
  const itemQuantity = item?.quantity;
  const itemQuantityUnit = item?.quantityUnit;
  const itemRecipeTitle = item?.recipe?.title;

  return (
    <View
      className={clsx(
        "flex-row items-center py-2 gap-1",
        isCompleted && "opacity-50"
      )}
    >
      <TouchableOpacity
        onPress={onPressCheckbox}
        onLongPress={onLongPressCheckbox}
        activeOpacity={0.8}
      >
        <View className="pl-4 -ml-3 pr-3 py-1">
          <Checkbox checked={isCompleted} checkedColor={colorScheme === "dark" ? "#F5F0EB" : "#292119"} checkmarkColor={colorScheme === "dark" ? "#1C1917" : "white"} />
        </View>
      </TouchableOpacity>
      <EditGroceryItemModal
        item={item}
        activeOpacity={0.8}
        className="flex-1 flex-row items-center"
      >
        <View className="flex-1 gap-1">
          <View className="flex-row items-baseline gap-3">
            <View className="flex-0">
              <Text
                className={clsx(
                  isIpad() ? "text-2xl" : isIPhone16Pro() ? "text-xl" : "text-2xl",
                  "flex-1 font-body-medium",
                  isCompleted
                    ? "line-through text-muted-light dark:text-muted-dark"
                    : "text-foreground-light dark:text-foreground-dark"
                )}
              >
                {itemName}
              </Text>
            </View>
            <View className="flex-row items-baseline gap-1">
              {itemQuantity != null ? (
                <Text
                  className={clsx(
                    isIpad() ? "text-xl" : isIPhone16Pro() ? "text-lg" : "text-xl",
                    "font-body text-muted-light dark:text-muted-dark"
                  )}
                >
                  {itemQuantity}
                </Text>
              ) : null}
              {itemQuantityUnit != null && itemQuantityUnit !== "" ? (
                <Text
                  className={clsx(
                    isIpad() ? "text-xl" : isIPhone16Pro() ? "text-lg" : "text-xl",
                    "font-body text-muted-light dark:text-muted-dark"
                  )}
                >
                  {itemQuantityUnit}
                </Text>
              ) : null}
            </View>
          </View>
          <View>
            {itemRecipeTitle && (
              <Text
                className={clsx(
                  isIpad() ? "text-lg" : isIPhone16Pro() ? "text-base" : "text-lg",
                  "font-body text-muted-light dark:text-muted-dark"
                )}
              >
                {itemRecipeTitle}
              </Text>
            )}
          </View>
        </View>
      </EditGroceryItemModal>
    </View>
  );
};

export default GroceryItemComponent;
