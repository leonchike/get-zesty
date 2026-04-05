import { View, Text } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSettingsStore } from "../store/settings-store";
import CustomButton from "@/components/custom-button";
import { LeftChevronIcon } from "@/components/custom-icons";

export function Header({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View className="flex-row items-center justify-between mb-6">
      <View className="w-24">
        <BackButton />
      </View>
      <View className="flex-1 items-center gap-3">
        <Text className="text-2xl font-heading-semibold text-foreground-light dark:text-foreground-dark">
          {title}
        </Text>
        {description && (
          <Text className="text-sm font-body text-muted-light dark:text-muted-dark">
            {description}
          </Text>
        )}
      </View>
      <View className="w-24" />
    </View>
  );
}

function BackButton() {
  const colorScheme = useColorScheme();
  const { setSettingsState, settingsState } = useSettingsStore();

  const shouldShowBackButton = settingsState !== "settingsHome";

  const handleBack = () => {
    setSettingsState("settingsHome");
  };

  return (
    shouldShowBackButton && (
      <View className=" flex-row justify-between items-center -my-3">
        <CustomButton
          handlePress={handleBack}
          variant="ghost"
          containerStyles="py-2 border-0 pl-0"
        >
          <View className="flex-row items-center gap-3">
            <LeftChevronIcon
              width={12}
              height={18}
              color={colorScheme === "dark" ? "#A8A29E" : "#78716C"}
            />
          </View>
        </CustomButton>
      </View>
    )
  );
}
