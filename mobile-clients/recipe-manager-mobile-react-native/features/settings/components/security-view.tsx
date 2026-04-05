import { View, Text } from "react-native";
import React, { useState } from "react";

// components
import { Header } from "./shared-components";
import InputField from "@/components/input-field";
import CustomButton from "@/components/custom-button";

// context
import { useAuth } from "@/context/AuthContext";

/**
 * A simple regex to check for at least one special character.
 * This matches characters NOT in A-Za-z0-9.
 * Customize as needed for your app's definition of "special character".
 */
const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const SettingsSecurityView = () => {
  const { updateUserDataPassword } = useAuth();

  // Local state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Whenever the user types, clear any existing error or success message,
   * because we assume they're fixing something or making a new attempt.
   */
  const handleChangeOld = (text: string) => {
    setOldPassword(text);
    clearMessages();
  };

  const handleChangeNew = (text: string) => {
    setNewPassword(text);
    clearMessages();
  };

  const handleChangeConfirm = (text: string) => {
    setConfirmPassword(text);
    clearMessages();
  };

  const clearMessages = () => {
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  /**
   * Validate the new password before sending:
   * 1. Check new password length >= 6
   * 2. Check new password contains at least 1 special character
   * 3. Check newPassword === confirmPassword
   * If validation fails, setError and return early.
   */
  const validatePasswords = () => {
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return false;
    }

    if (!SPECIAL_CHAR_REGEX.test(newPassword)) {
      setError("New password must include at least one special character.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return false;
    }

    return true;
  };

  /**
   * Attempt password update:
   * - First validate the new password & confirmPassword.
   * - If valid, call the auth context method.
   */
  const handleUpdatePassword = async () => {
    // Clear out old messages
    setError(null);
    setSuccess(null);

    // Validate before calling backend
    const isValid = validatePasswords();
    if (!isValid) return;

    setIsLoading(true);
    try {
      const response = await updateUserDataPassword(oldPassword, newPassword);
      // response => { success: boolean; error?: string; message?: string; }

      if (response.success) {
        // Password update success!
        setSuccess(response.message || "Password updated successfully!");
        // Reset form fields
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        // Server indicated failure
        setError(response.error || "Password update failed. Please try again.");
      }
    } catch (err) {
      console.error("Update Password Error:", err);
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      <Header title="Security" />

      <View className="mb-6">
        <Text className="text-lg font-body text-muted-light dark:text-muted-dark leading-6">
          Security is a top priority for us. Please enter your current password
          and a secure new password you want to set.
        </Text>
      </View>

      <View className="flex-col gap-4">
        <InputField
          title="Current Password"
          value={oldPassword}
          handleChange={handleChangeOld}
          secureTextEntry
        />

        <InputField
          title="New Password"
          value={newPassword}
          handleChange={handleChangeNew}
          secureTextEntry
        />

        <InputField
          title="Confirm New Password"
          value={confirmPassword}
          handleChange={handleChangeConfirm}
          secureTextEntry
        />

        <CustomButton
          handlePress={handleUpdatePassword}
          isLoading={isLoading}
          variant="primary"
        >
          <Text>{isLoading ? "Updating..." : "Update Password"}</Text>
        </CustomButton>

        {/* Error / Success */}
        {error && (
          <Text className="text-red-500 font-body mt-1">{error}</Text>
        )}
        {success && (
          <Text className="text-green-500 font-body mt-1">{success}</Text>
        )}
      </View>
    </View>
  );
};

export default SettingsSecurityView;
