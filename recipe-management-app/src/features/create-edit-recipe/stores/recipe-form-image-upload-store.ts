// src/lib/stores/image-upload-store.ts
"use client";

import { create } from "zustand";
import {
  requestOneTimeUploadUrl,
  uploadRecipeImageFromUrl,
} from "@/lib/actions/recipe-actions";
import axios from "axios";
import { preprocessImage } from "@/lib/functions/image-helpers";

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
  uploadImage: (file: File | string) => Promise<void>;
  validateImage: (input: string | File) => Promise<boolean>;
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
  uploadImage: async (file: File | string) => {
    set({ modalState: "uploading" });
    try {
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      // Validate the image before proceeding
      const isValid = await get().validateImage(file);
      if (!isValid) {
        throw new Error("Invalid image file or URL");
      }

      if (typeof file === "string") {
        const response = await uploadRecipeImageFromUrl(file);

        if (response.success) {
          set({
            imageUrl: response.imageUrl,
            modalState: "default",
            isOpen: false,
          });
        } else {
          throw new Error("Failed to upload image");
        }
      } else {
        const response = await requestOneTimeUploadUrl();
        const uploadUrl = response.uploadURL;
        const id = response.id;

        const formData = new FormData();

        const processedImage = await preprocessImage(file);

        if (processedImage.size > MAX_FILE_SIZE) {
          throw new Error("Processed image is too large");
        }

        formData.append("file", processedImage, "image.webp");

        const uploadResponse = await axios.post(uploadUrl, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (uploadResponse.status !== 200) {
          throw new Error("Failed to upload image");
        }

        const imageUrl = `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${id}/largeartwork`;
        set({ imageUrl, modalState: "default", isOpen: false });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      set({
        error: "Failed to upload image. Please try again.",
        modalState: "error",
      });
    }
  },
  validateImage: async (input: string | File): Promise<boolean> => {
    if (typeof input === "string") {
      // URL validation
      try {
        // Check Content-Type header
        // const response = await fetch(input, { method: "HEAD" });
        // const contentType = response.headers.get("Content-Type");
        // if (!contentType || !contentType.startsWith("image/")) {
        //   return false;
        // }

        // Try to load the image
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = input;
        });
      } catch (error) {
        console.error("Error validating image URL:", error);
        return false;
      }
    } else {
      // File/Blob validation
      if (!input.type.startsWith("image/")) {
        return false;
      }

      // Try to create an image from the file
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(input);
      });
    }
  },
  reset: () => set({ modalState: "default", error: null, imageUrl: null }),
}));
