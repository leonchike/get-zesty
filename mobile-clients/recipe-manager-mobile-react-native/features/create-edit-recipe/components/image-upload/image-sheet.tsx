import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { cn } from "@/lib/helpers/cn";
import * as ImagePicker from "expo-image-picker";

// components
import CustomButton from "@/components/custom-button";
import {
  ImageIcon,
  LinkIcon,
  LeftChevronIcon,
} from "@/components/custom-icons";
import InputField from "@/components/input-field";

// hooks
import { useColorScheme } from "@/hooks/useColorScheme";
import { useDeviceType } from "@/hooks/useDeviceType";

// stores
import { useImageUploadStore } from "../../stores/recipe-form-image-upload-store";
import useUIStore from "@/stores/global-ui-store";

const ImageSheet = () => {
  const { setModalState, modalState } = useImageUploadStore();

  const renderModalContent = () => {
    switch (modalState) {
      case "default":
        return <Default />;
      case "uploading":
        return <Loading />;
      case "error":
        return <Error />;
      case "url-paste":
        return <URLUpload />;
      case "unsplash":
        return <ImageFromUnsplash />;
      default:
        return null;
    }
  };

  return (
    <View className={cn("flex-1")}>
      <ScrollView className={cn("flex-1 px-8")}>
        <BackButton />
        {renderModalContent()}
      </ScrollView>
    </View>
  );
};

export default ImageSheet;

function Default() {
  const { setModalState, uploadImage } = useImageUploadStore();
  const colorScheme = useColorScheme();

  const color = colorScheme === "dark" ? "#151718" : "#fff";

  const handlePickImageFromLibrary = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        base64: false,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      const localUri = result.assets?.[0]?.uri;
      if (!localUri) return;

      try {
        await uploadImage(localUri, "cloudflare");
      } catch (error) {
        console.error("Error picking image from library:", error);
      }
    } catch (error) {
      console.error("Error picking image from library:", error);
    }
  };

  return (
    <View>
      <Header
        title="Recipe Image Upload"
        description="Upload an image for your recipe. This will be used as the main image for your recipe."
      />
      <View className="flex justify-between items-center gap-8">
        <CustomButton
          variant="secondary"
          containerStyles="w-full py-3"
          onPress={handlePickImageFromLibrary}
          title="Upload from Library"
          leftIcon={<ImageIcon width={25.45} height={20} color={color} />}
        />

        <CustomButton
          variant="secondary"
          containerStyles="w-full py-3"
          onPress={() => {
            setModalState("url-paste");
          }}
          title="Upload from Image URL"
          leftIcon={<LinkIcon width={20} height={20} color={color} />}
        />
      </View>
    </View>
  );
}

function Loading() {
  const colorScheme = useColorScheme();

  return (
    <View className="flex-1 items-center justify-center gap-3 py-12">
      <ActivityIndicator
        size="large"
        color={colorScheme === "dark" ? "#fff" : "#151718"}
      />
      <Text className="text-muted-light dark:text-muted-dark font-body-medium text-base">
        Uploading your image...
      </Text>
    </View>
  );
}

function Error() {
  const { error, setModalState } = useImageUploadStore();

  return (
    <View className="items-center justify-center gap-4 py-12">
      <Text className="text-red-500 font-body-semibold text-lg">
        Upload Failed
      </Text>
      <Text className="text-muted-light dark:text-muted-dark font-body text-base text-center">
        {error || "An error occurred while uploading your image."}
      </Text>
      <CustomButton
        onPress={() => setModalState("default")}
        variant="tertiary"
        title="Try Again"
      />
    </View>
  );
}

function URLUpload() {
  const { isIPhone16Pro } = useDeviceType();
  const [url, setUrl] = useState("");
  const { setModalState, modalState, uploadImage } = useImageUploadStore();

  const handleImportFromUrl = () => {
    console.log("Importing from URL:", url);
    setModalState("uploading");
    uploadImage(url);
  };

  return (
    <View>
      <View>
        <Header
          title="Import from Image URL"
          description="Paste the URL of the image you want to use for your recipe."
        />
      </View>

      <View className="flex-1 items-center justify-between relative">
        <InputField
          value={url}
          handleChange={(value) => setUrl(value)}
          placeholder="Paste image URL here"
          returnKeyType="go"
          pressableClassName="pr-24"
          textClassName="text-base pb-2 truncate"
          onSubmitEditing={handleImportFromUrl}
        />

        <View className={cn("absolute right-2 top-1/2 -translate-y-1/2")}>
          <CustomButton
            onPress={handleImportFromUrl}
            variant="secondary"
            isLoading={modalState === "uploading"}
            isDisabled={modalState === "uploading"}
            containerStyles={cn(isIPhone16Pro() ? "px-2 py-1" : "px-3 py-2")}
            title="Import"
            size="sm"
          />
        </View>
      </View>
    </View>
  );
}

function ImageFromUnsplash() {
  return (
    <View>
      <Text className="text-foreground-light dark:text-foreground-dark font-body">
        ImageFromUnsplash
      </Text>
    </View>
  );
}

function BackButton() {
  const colorScheme = useColorScheme();
  const { setModalState, modalState } = useImageUploadStore();

  const shouldShowBackButton =
    modalState !== "default" && modalState !== "uploading";

  const handleBack = () => {
    setModalState("default");
  };

  return (
    shouldShowBackButton && (
      <View className="mb-6 flex-row justify-between items-center -my-3">
        <CustomButton
          onPress={handleBack}
          variant="ghost"
          containerStyles="py-2 border-0 pl-0"
          title="Back"
          leftIcon={
            <LeftChevronIcon
              width={12}
              height={18}
              color={colorScheme === "dark" ? "#fff" : "#151718"}
            />
          }
          textStyles="font-body-semibold text-lg text-foreground-light dark:text-foreground-dark"
        />
      </View>
    )
  );
}

function Header({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View className="gap-3 mb-8">
      <Text className="text-2xl font-body-semibold text-foreground-light dark:text-foreground-dark">
        {title}
      </Text>
      {description && (
        <Text className="text-sm text-muted-light dark:text-muted-dark font-body">
          {description}
        </Text>
      )}
    </View>
  );
}
