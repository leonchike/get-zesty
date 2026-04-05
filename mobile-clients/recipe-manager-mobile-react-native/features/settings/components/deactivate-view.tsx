import React, { useState } from "react";
import { View, Text } from "react-native";
import { useAuth } from "@/context/AuthContext";

// components
import { Header } from "./shared-components";
import InputField from "@/components/input-field";
import CustomButton from "@/components/custom-button";

// hooks
import useUIStore from "@/stores/global-ui-store";
import { useRouter } from "expo-router";

const SettingsDeactivateView = () => {
  const router = useRouter();
  const { deactivateDataAccount } = useAuth();
  const { setSettingsModalVisible } = useUIStore();

  // State to track whether user has clicked "Deactivate" and needs to confirm
  const [isConfirming, setIsConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeactivateButton = () => {
    // Show confirm password field
    setIsConfirming(true);
    setError(null);
  };

  const handleCancel = () => {
    // Go back to default view
    setIsConfirming(false);
    setPassword("");
    setError(null);
  };

  const handleConfirmDeactivate = async () => {
    // Basic validation: ensure password isn't empty
    if (!password.trim()) {
      setError("Please enter your password to confirm.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await deactivateDataAccount(password);
      // response => { success: boolean; error?: string; message?: string }
      if (response.success) {
        // On success, route to login screen
        setSettingsModalVisible(false);
        router.replace("/(auth)/log-in");
      } else {
        // If server returns an error
        setError(
          response.error || "Unable to delete account. Please try again."
        );
      }
    } catch (err) {
      console.error("Deactivate Error:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <Header title="Delete" />

      <View className="mb-6">
        <Text className="text-lg font-body text-muted-light dark:text-muted-dark leading-6">
          Account deletion will remove your account and all associated data.
          Additionally, the email associated with your account will be deleted
          and you will not be able to reactivate your account. If you'd like to
          simply temporarily disable your account, please reach out to our
          support team at{" "}
          <Text className="text-primary-light">getzesty.food</Text> for assistance
          with reactivation.
        </Text>
      </View>

      {!isConfirming ? (
        // DEFAULT: Show only the Delete Account button
        <View>
          <CustomButton handlePress={handleDeactivateButton} variant="danger">
            <Text>Delete Account</Text>
          </CustomButton>
        </View>
      ) : (
        // CONFIRMATION: Ask for password & show Confirm/Cancel
        <View className="mt-4">
          <Text className="mb-4 font-body text-muted-light dark:text-muted-dark">
            Please enter your password to confirm deactivation.
          </Text>

          <InputField
            value={password}
            handleChange={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
            secureTextEntry
          />

          <View className="flex-row gap-3 mt-4">
            <CustomButton handlePress={handleCancel} variant="ghost">
              <Text>Cancel</Text>
            </CustomButton>

            <CustomButton
              handlePress={handleConfirmDeactivate}
              isLoading={isLoading}
              variant="danger"
            >
              <Text>{isLoading ? "Deleting..." : "Confirm Deletion"}</Text>
            </CustomButton>
          </View>

          {/* Error Message */}
          {error && (
            <Text className="text-red-500 font-body mt-2">{error}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default SettingsDeactivateView;
