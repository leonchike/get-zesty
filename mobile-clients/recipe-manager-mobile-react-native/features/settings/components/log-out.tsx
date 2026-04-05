import { View, Text } from "react-native";
import React from "react";

// global context
import { useAuth } from "@/context/AuthContext";
import useUIStore from "@/stores/global-ui-store";

// components
import CustomButton from "@/components/custom-button";

const SettingsLogOut = () => {
  const { logout } = useAuth();
  const { setSettingsModalVisible } = useUIStore();
  return (
    <View>
      <CustomButton
        handlePress={() => {
          logout();
          setSettingsModalVisible(false);
        }}
        variant="ghost"
        textStyles="text-[#FF385C] font-body-semibold"
      >
        Sign Out
      </CustomButton>
    </View>
  );
};

export default SettingsLogOut;
