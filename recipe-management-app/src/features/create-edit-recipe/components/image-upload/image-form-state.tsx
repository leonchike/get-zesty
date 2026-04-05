"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImageModal } from "./image-modal";
import clsx from "clsx";
import { Label } from "@/components/ui/label";
import { useImageUploadStore } from "@/features/create-edit-recipe/stores/recipe-form-image-upload-store";
import { formatImageUrl } from "@/lib/image-upload/cloudflare-images";

interface ImageFormStateProps {
  imageUrl?: string | null;
  setValue: (value: string) => void;
}

export default function ImageFormState({
  imageUrl: initialImageUrl,
  setValue,
}: ImageFormStateProps) {
  const {
    isOpen,
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

  useEffect(() => {
    if (initialImageUrl) {
      setImageUrl(initialImageUrl);
    } else {
      setImageUrl(null);
    }
  }, [initialImageUrl, setImageUrl]);

  const handleDeleteImage = () => {
    setImageUrl(null);
  };

  useEffect(() => {
    if (imageUrl) {
      console.log("updating form value", imageUrl);
      setValue(imageUrl); // Update the form with the new image URL
    }
  }, [imageUrl, setValue]);

  return (
    <div>
      <Label htmlFor="image">Image</Label>
      {!imageUrl && <NoImage setIsModalOpen={setIsOpen} />}
      {imageUrl && (
        <ImagePreview
          imageUrl={imageUrl}
          setIsModalOpen={setIsOpen}
          handleDeleteImage={handleDeleteImage}
        />
      )}
      <ImageModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        setValue={setValue}
      />
    </div>
  );
}

function NoImage({
  setIsModalOpen,
}: {
  setIsModalOpen: (isModalOpen: boolean) => void;
}) {
  return (
    <div
      className={clsx(
        "relative w-full h-52 border border-dashed rounded-md flex items-center justify-center",
        "transition-colors duration-300 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
        "border-gray-300 dark:border-gray-600"
      )}
    >
      <Button type="button" onClick={() => setIsModalOpen(true)}>
        Upload Image
      </Button>
    </div>
  );
}

function ImagePreview({
  imageUrl,
  setIsModalOpen,
  handleDeleteImage,
}: {
  imageUrl: string;
  setIsModalOpen: (isModalOpen: boolean) => void;
  handleDeleteImage: () => void;
}) {
  const formattedUrl = formatImageUrl(imageUrl);
  
  if (!formattedUrl) return null;
  
  return (
    <div className="relative w-full h-52 rounded-md">
      <Image
        src={formattedUrl}
        alt="Recipe preview"
        fill
        className="object-cover rounded-md"
      />
      <div className="absolute bottom-2 right-2 flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={handleDeleteImage}
        >
          Remove Image
        </Button>
        <Button
          type="button"
          onClick={() => setIsModalOpen(true)}
          size="sm"
          className="flex-1"
        >
          Change Image
        </Button>
      </div>
    </div>
  );
}
