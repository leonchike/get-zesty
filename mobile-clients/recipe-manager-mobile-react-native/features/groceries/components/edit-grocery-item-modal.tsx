import React, { useState } from "react";
import { Text, View, Button, TouchableOpacity } from "react-native";
import { GroceryItem } from "@/lib/types";
import ModalBase from "@/components/modal-base";
import ModalHeader from "@/components/modal-header";
import InputField from "@/components/input-field";
import { Picker } from "@react-native-picker/picker";
import CustomButton from "@/components/custom-button";
import { useDeviceType } from "@/hooks/useDeviceType";
import clsx from "clsx";

// hooks
import {
  useGrocerySectionsQuery,
  useUpdateGroceryItem,
  useDeleteGroceryItem,
} from "@/features/groceries/hooks/grocery-query-hooks";

const EditGroceryItemModal = ({
  item,
  className,
  activeOpacity,
  children,
}: {
  item: GroceryItem;
  activeOpacity?: number;
  className?: string;
  children: React.ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity?.toString() || "");
  const [unit, setUnit] = useState(item.quantityUnit || "");
  const [sectionId, setSectionId] = React.useState(item.sectionId || "");

  const { data: sections, isLoading: isSectionsLoading } =
    useGrocerySectionsQuery();

  const updateGroceryItem = useUpdateGroceryItem();
  const deleteGroceryItem = useDeleteGroceryItem();

  const handleSaveChanges = () => {
    updateGroceryItem.mutate({
      id: item.id,
      name,
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      quantityUnit: unit || undefined,
      sectionId: sectionId || undefined,
    });
    setIsVisible(false);
  };

  const handleDelete = () => {
    deleteGroceryItem.mutate(item.id);
    setIsVisible(false);
  };

  return (
    <TouchableOpacity
      onLongPress={() => setIsVisible(true)}
      className={className}
      activeOpacity={activeOpacity}
    >
      {children}
      <ModalBase
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
        withInput
        ModalName="Edit Grocery Item"
      >
        <View className="w-[90%] bg-backgroundGray-light dark:bg-backgroundGray-dark rounded-lg p-4">
          <ModalHeader
            ModalName="Edit Grocery Item"
            onClose={() => setIsVisible(false)}
          />
          <View className="flex-col gap-5">
            <InputField
              title="Name"
              value={name}
              handleChange={(text) => setName(text)}
              keyboardType="default"
            />

            <InputField
              title="Quantity"
              value={quantity}
              handleChange={(text) => setQuantity(text)}
              keyboardType="number-pad"
            />

            <InputField
              title="Unit"
              value={unit}
              handleChange={(text) => setUnit(text)}
              keyboardType="default"
            />

            {isSectionsLoading ? (
              <Text>Loading sections...</Text>
            ) : (
              <Picker
                selectedValue={sectionId}
                onValueChange={(itemId: string) => setSectionId(itemId)}
              >
                {sections?.map((section) => (
                  <Picker.Item
                    key={section.id}
                    label={section.name || "Unnamed Section"}
                    value={section.id}
                  />
                ))}
              </Picker>
            )}

            <View className="flex-row justify-between gap-2">
              <CustomButton variant="ghost" handlePress={handleDelete}>
                Delete
              </CustomButton>

              <CustomButton handlePress={handleSaveChanges}>
                Save changes
              </CustomButton>
            </View>
          </View>
        </View>
      </ModalBase>
    </TouchableOpacity>
  );
};

export default EditGroceryItemModal;
