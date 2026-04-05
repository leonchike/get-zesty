import { create } from "zustand";
import {
  uploadImageToBackendFromUrl,
  uploadImageToCloudflare,
} from "../actions/recipe-actions";
import { Image } from "react-native";

// stores
import useUIStore from "@/stores/global-ui-store";

type ModalState = "default" | "uploading" | "error" | "url-paste" | "unsplash";

interface ImageUploadState {
  isOpen: boolean;
  modalState: ModalState;
  error: string | null;
  imageUrl: string | null;
  setImageUrl: (imageUrl: string | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  setModalState: (state: ModalState) => void;
  setError: (error: string | null) => void;
  uploadImage: (
    file: string,
    uploadType?: "url" | "cloudflare"
  ) => Promise<void>;
  validateImage: (input: string | FormData) => Promise<boolean>;
  reset: () => void;
}

export const useImageUploadStore = create<ImageUploadState>((set, get) => ({
  isOpen: false,
  modalState: "default",
  error: null,
  imageUrl: null,
  setImageUrl: (imageUrl: string | null) => set({ imageUrl }),
  setIsOpen: (isOpen) => set({ isOpen }),
  setModalState: (state) => set({ modalState: state }),
  setError: (error) => set({ error }),
  uploadImage: async (
    file: string,
    uploadType: "url" | "cloudflare" = "url"
  ) => {
    set({ modalState: "uploading" });
    try {
      if (uploadType === "cloudflare") {
        const imageURL = await uploadImageToCloudflare(file);

        if (!imageURL || typeof imageURL !== "string") {
          throw new Error(
            "Image upload failed. Please check your connection and try again."
          );
        }

        set({
          imageUrl: imageURL,
          modalState: "default",
        });
        // close the modal
        useUIStore.getState().setImageSheetModalVisible(false);
      }

      if (uploadType === "url") {
        // Validate the image before proceeding
        const isValid = await get().validateImage(file);
        if (!isValid) {
          throw new Error("The image URL is invalid or could not be loaded. Please check the URL and try again.");
        }

        if (typeof file === "string") {
          const response = await uploadImageToBackendFromUrl({
            imageUrl: file,
          });

          if (response.success) {
            set({
              imageUrl: response.imageUrl,
              modalState: "default",
            });
            // close the modal
            useUIStore.getState().setImageSheetModalVisible(false);
          } else {
            throw new Error("Failed to upload image");
          }
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      const message = error instanceof Error ? error.message : "Failed to upload image. Please try again.";
      set({
        error: message,
        modalState: "error",
      });
    }
  },
  validateImage: async (input: string | FormData): Promise<boolean> => {
    if (typeof input === "string") {
      // URL validation
      try {
        // For URLs, we can use Image.prefetch in React Native
        await Image.prefetch(input);
        return true;
      } catch (error) {
        console.error("Error validating image URL:", error);
        return false;
      }
    } else {
      // File validation
      try {
        const file = input.get("file") as any;
        if (!file?.type?.startsWith("image/")) {
          return false;
        }

        // For files, we can check the file type and existence
        // Additional validation could be done here if needed
        return true;
      } catch (error) {
        console.error("Error validating image file:", error);
        return false;
      }
    }
  },
  reset: () => set({ modalState: "default", error: null, imageUrl: null }),
}));
