import { View, Text, Keyboard } from "react-native";
import React, { useState, useEffect } from "react";

// components
import { Header } from "./shared-components";
import InputField from "@/components/input-field";
import CustomButton from "@/components/custom-button";

// context
import { useAuth } from "@/context/AuthContext";

const SettingsProfileView = () => {
  const { user, updateUserData } = useAuth();

  // State
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Keep the local `name` state in sync with user.name.
   * If the user object changes (for any reason), reset the local state.
   */
  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  /**
   * Whenever the user types into the name field, reset any error that might be
   * showing (because we assume they're fixing it).
   */
  const handleChange = (text: string) => {
    setName(text);
    if (error) {
      setError(null);
    }
  };

  /**
   * Save the profile name by calling `updateUserData`.
   * - Show a loading indicator on the button while waiting.
   * - If something goes wrong, display a helpful error message below the button.
   */
  const handleSave = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Reset error before attempt
    setError(null);
    setIsLoading(true);
    try {
      const response = await updateUserData({ name });

      if (response) {
        console.log("Profile updated successfully");
      } else {
        console.log("Profile update failed");
        setError("Profile update failed");
      }
    } catch (error) {
      console.log(error);
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <Header title="Profile" />

      <View className="flex-col gap-4">
        <InputField title="Name" value={name} handleChange={handleChange} />

        <CustomButton
          handlePress={handleSave}
          isLoading={isLoading}
          variant="primary"
        >
          <Text>{isLoading ? "Updating" : "Update"}</Text>
        </CustomButton>

        {/* If there's an error, display it under the button */}
        {error && (
          <Text className="text-red-500 font-body mt-1">{error}</Text>
        )}
      </View>
    </View>
  );
};

export default SettingsProfileView;
