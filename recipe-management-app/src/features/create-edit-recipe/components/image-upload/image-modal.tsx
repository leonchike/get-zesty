"use client";

import React, { useState, useCallback } from "react";
import { Modal } from "@/components/ui/reusable-modal-v2";
import { useImageUploadStore } from "@/features/create-edit-recipe/stores/recipe-form-image-upload-store";
import { quantum } from "ldrs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LeftChevronIcon,
  LinkIcon,
  UnsplashLogo,
} from "@/components/ui/icons/custom-icons";
import ImageFromUnsplash from "./image-from-unsplash";

// Register the quantum loading animation
quantum.register();

export function ImageModal({
  isOpen,
  onClose,
  setValue,
}: {
  isOpen: boolean;
  onClose: () => void;
  setValue: (field: string, value: string) => void;
}) {
  const {
    modalState,
    error,
    imageUrl,
    setImageUrl,
    setIsOpen,
    setModalState,
    setError,
    uploadImage,
    reset,
  } = useImageUploadStore();

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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setModalState("default");
      }}
      className="w-full max-w-[90vw] md:max-w-[48rem] xl:max-w-[48rem] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="relative flex-grow overflow-auto pt-4 min-h-[200px]">
        {renderModalContent()}
      </div>
    </Modal>
  );
}

function Loading() {
  return (
    <div className="absolute inset-0 bg-opacity-90 flex flex-col items-center justify-center text-brand-light">
      <l-quantum size="45" speed="1.75" color="currentColor"></l-quantum>
      <p className="mt-4 text-base font-medium">Processing image...</p>
    </div>
  );
}

function Error() {
  const { error, reset } = useImageUploadStore();

  return (
    <div className="flex flex-col items-center justify-center h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0">
      <div className="flex flex-col justify-center gap-4">
        <div>
          <h1 className="text-lg font-medium">An error occurred</h1>
          <p className="text-sm opacity-80">{error}</p>
        </div>
        <Button onClick={reset}>Reset</Button>
      </div>
    </div>
  );
}

function Default() {
  const {
    modalState,
    error,
    imageUrl,
    setImageUrl,
    setIsOpen,
    setModalState,
    setError,
    uploadImage,
    reset,
  } = useImageUploadStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <ImageUpload />
      </div>
      <div className="flex flex-col gap-8 justify-center">
        <div className="w-full">
          <Button className="w-full" onClick={() => setModalState("unsplash")}>
            <span className="mr-2">
              <UnsplashLogo width={18} height={18} />
            </span>
            <span>Unsplash</span>
          </Button>
        </div>
        <div className="w-full">
          <Button className="w-full" onClick={() => setModalState("url-paste")}>
            <span className="mr-2">
              <LinkIcon width={18} height={18} />
            </span>
            <span>Import from URL</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImageUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const {
    modalState,
    error,
    imageUrl,
    setImageUrl,
    setIsOpen,
    setModalState,
    setError,
    uploadImage,
    reset,
  } = useImageUploadStore();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setIsUploading(true);
      uploadImage(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      className={cn(
        "relative w-full h-48 border border-dashed rounded-md transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 hover:border-primary-light dark:hover:border-primary-dark",
        isDragging
          ? "border-primary-light dark:border-primary-dark"
          : "border-gray-300 dark:border-gray-600"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        id="image"
        accept="image/*"
        onChange={(e) => e.target.files && uploadImage(e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
        disabled={isUploading}
      />
      <div className="flex flex-col items-center justify-center h-full text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">
          {isUploading ? "Uploading..." : "Click or drag image to upload"}
        </p>
      </div>
    </div>
  );
}

function URLUpload() {
  const {
    modalState,
    error,
    imageUrl,
    setImageUrl,
    setIsOpen,
    setModalState,
    setError,
    uploadImage,
    validateImage,
    reset,
  } = useImageUploadStore();
  const [formError, setFormError] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = async () => {
    setFormError("");

    try {
      const isValid = await validateImage(url);
      if (!isValid) {
        setFormError(
          "The provided URL is not a valid image. Please try again."
        );
        return;
      }

      await uploadImage(url);
    } catch (error) {
      setError("Failed to upload image. Please try again.");
    }
  };

  return (
    <div>
      <BackButton />
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-medium">Upload from URL</h1>
          <p className="text-sm opacity-80">
            Paste the URL of the image you want to upload
          </p>
        </div>

        <div className="relative">
          <Input
            type="url"
            placeholder="Enter an image URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pr-[100px] h-12"
          />
          <Button
            className="absolute right-[4px] top-[4px] py-2"
            onClick={handleSubmit}
          >
            Import
          </Button>
          {formError && (
            <div className="absolute -bottom-6 text-sm opacity-80 text-red-500">
              {formError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BackButton() {
  const { reset } = useImageUploadStore();
  return (
    <div className="-translate-y-[1.5rem]">
      <Button
        onClick={reset}
        variant="ghost"
        className="hover:bg-transparent hover:text-textColor-light dark:hover:text-textColor-dark px-0"
      >
        <span className="mr-2">
          <LeftChevronIcon width={16} height={16} />
        </span>
        Back
      </Button>
    </div>
  );
}
