import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useImageUploadStore } from "@/features/create-edit-recipe/stores/recipe-form-image-upload-store";
import { UnsplashApiResponse, UnsplashPhoto } from "@/lib/types/types";
import ROUTES from "@/lib/constants/routes";
import { BackButton } from "./image-modal";

export default function ImageFromUnsplash() {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<UnsplashPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const { uploadImage } = useImageUploadStore();

  const perPage = 24; // You can adjust this value as needed

  const searchUnsplash = async (newSearch: boolean = false) => {
    setIsLoading(true);
    const searchPage = newSearch ? 1 : page;
    try {
      const response = await fetch(
        `${ROUTES.UNSPLASH_SEARCH}?query=${encodeURIComponent(
          query
        )}&page=${searchPage}&perPage=${perPage}`
      );
      const data: UnsplashApiResponse = await response.json();
      setImages(newSearch ? data.photos : [...images, ...data.photos]);
      setTotalPages(data.totalPages);
      setPage(searchPage);
    } catch (error) {
      console.error("Error searching Unsplash:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    searchUnsplash(true);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(page + 1);
      searchUnsplash();
    }
  };

  const handleImageSelect = async (imageUrl: string) => {
    await uploadImage(imageUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      <BackButton />
      <div className="space-y-6 px-1">
        <div className="space-y-1 mb-4">
          <h1 className="text-lg font-medium">Search Unsplash</h1>
          <p className="text-sm opacity-80">
            Search for an image on Unsplash and select it to upload
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex space-x-2 relative">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search Unsplash..."
              className="flex-grow pr-[100px] h-12"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="absolute right-[4px] top-[4px] py-2"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <UnsplashImage
                key={image.id}
                image={image}
                onSelect={() => handleImageSelect(image.urls.regular)}
              />
            ))}
          </div>
          {page < totalPages && (
            <div className="text-center">
              <Button onClick={handleLoadMore} disabled={isLoading}>
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UnsplashImage({
  image,
  onSelect,
}: {
  image: UnsplashPhoto;
  onSelect: () => void;
}) {
  return (
    <div className="relative group aspect-square">
      <Image
        src={image.urls.regular}
        alt={image.alt_description || "Unsplash Image"}
        fill
        className="object-cover rounded-md"
        unoptimized
      />
      <Button
        className="absolute bottom-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity"
        onClick={onSelect}
        size="sm"
      >
        Select
      </Button>
    </div>
  );
}
