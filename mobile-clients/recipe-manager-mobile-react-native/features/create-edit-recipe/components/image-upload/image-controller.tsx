import { View, Text, Image, Dimensions } from "react-native";
import React, { useEffect } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import CustomButton from "@/components/custom-button";
import { ImageIcon } from "@/components/custom-icons";

// stores
import { useImageUploadStore } from "../../stores/recipe-form-image-upload-store";
import useUIStore from "@/stores/global-ui-store";

// hooks
import { useDeviceType } from "@/hooks/useDeviceType";
import { cn } from "@/lib/helpers/cn";
import { warmShadow } from "@/lib/helpers/warm-shadows";

const ImageController = ({
  initialImage,
  setValueOnFormState,
}: {
  initialImage: string;
  setValueOnFormState: (value: string) => void;
}) => {
  const { isImageSheetModalVisible } = useUIStore();
  const {
    setIsOpen,
    setModalState,
    imageUrl,
    setImageUrl,
    reset: resetImageUpload,
  } = useImageUploadStore();

  useEffect(() => {
    if (initialImage) {
      setImageUrl(initialImage || null);
    }

    return () => {
      resetImageUpload();
    };
  }, [initialImage]);

  const handleDeleteImage = () => {
    setValueOnFormState("");
    setImageUrl(null);
  };

  useEffect(() => {
    if (imageUrl) {
      setValueOnFormState(imageUrl);
    }
  }, [imageUrl]);

  useEffect(() => {
    if (!isImageSheetModalVisible) {
      setModalState("default");
    }
  }, [isImageSheetModalVisible]);

  return (
    <View>
      {imageUrl ? (
        <ImagePreview
          imageUrl={imageUrl}
          handleDeleteImage={handleDeleteImage}
        />
      ) : (
        <NoImageAvailable />
      )}
    </View>
  );
};

export default ImageController;

function NoImageAvailable() {
  const { setImageSheetModalVisible } = useUIStore();
  return (
    <View className="relative w-full h-52 border-2 border-dashed rounded-2xl items-center justify-center border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
      <View className="items-center gap-3">
        <ImageIcon width={32} height={32} color="#78716C" />
        <Text className="text-muted-light dark:text-muted-dark font-body-medium text-base">
          Tap to add a photo
        </Text>
      </View>
      <CustomButton
        variant="tertiary"
        onPress={() => {
          setImageSheetModalVisible(true);
        }}
        title="Upload Image"
        containerStyles="mt-4"
      />
    </View>
  );
}

const { height: screenHeight } = Dimensions.get("window");
const halfScreenHeight = screenHeight * 0.5;

function ImagePreview({
  imageUrl,
  handleDeleteImage,
}: {
  imageUrl: string;
  handleDeleteImage: () => void;
}) {
  const { deviceType } = useDeviceType();
  const { setImageSheetModalVisible } = useUIStore();

  if (!imageUrl) return null;

  const containerStyle =
    deviceType === "iPad"
      ? {
          width: "100%" as const,
          maxHeight: halfScreenHeight,
        }
      : {
          width: "100%" as const,
          aspectRatio: 1,
        };

  const imageStyle =
    deviceType === "iPad"
      ? {
          width: "100%" as const,
          height: "100%" as const,
          resizeMode: "cover" as const,
        }
      : {
          width: "100%" as const,
          aspectRatio: 1,
          resizeMode: "cover" as const,
        };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[containerStyle, warmShadow("sm")]}
      className="rounded-2xl overflow-hidden relative"
    >
      <Image source={{ uri: imageUrl }} style={imageStyle} />

      <View className="absolute bottom-3 right-3 flex-row gap-3">
        <CustomButton
          onPress={handleDeleteImage}
          variant="danger"
          title="Remove"
          size="sm"
        />

        <CustomButton
          onPress={() => {
            setImageSheetModalVisible(true);
          }}
          variant="secondary"
          title="Change"
          size="sm"
        />
      </View>
    </Animated.View>
  );
}
