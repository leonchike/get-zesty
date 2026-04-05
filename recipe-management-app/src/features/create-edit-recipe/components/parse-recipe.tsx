"use client";

import { useRecipeStore } from "@/features/create-edit-recipe/stores/recipe-form-store";
import { ReusableModal } from "@/components/ui/reusable-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useState, useEffect, forwardRef } from "react";

export function ParseRecipe() {
  const {
    setScrapeUrl,
    scrapeUrl,
    isScraping,
    scrapeRecipe,
    scrapeSuccess,
    scrapeError,
    resetScrapeForm,
  } = useRecipeStore();
  const [isOpen, setIsOpen] = useState(false);
  const [urlError, setUrlError] = useState("");

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const localUrl = formData.get("recipe-url") as string;

    if (!localUrl || !isValidUrl(localUrl)) {
      setUrlError("Please enter a valid URL.");
      return;
    }

    setUrlError("");
    setScrapeUrl(localUrl);
    scrapeRecipe(localUrl);
  };

  useEffect(() => {
    if (scrapeSuccess) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        resetScrapeForm();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [scrapeSuccess, resetScrapeForm]);

  return (
    <ReusableModal
      trigger={<ScrapeButton setIsOpen={setIsOpen} />}
      title="Import Recipe"
      description="Paste a link to your favorite online recipe, and we'll automatically import it for you."
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setScrapeUrl("");
      }}
      allowClose={!isScraping}
      triggerClose={isOpen}
    >
      <form onSubmit={handleScrape} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipe-url">Recipe URL</Label>
          <Input
            id="recipe-url"
            name="recipe-url"
            placeholder="Example: bonappetit.com/recipe/simple-carbonara"
            value={scrapeUrl || ""}
            onChange={(e) => setScrapeUrl(e.target.value)}
            disabled={isScraping || scrapeSuccess}
          />
        </div>
        {scrapeError && <p className="text-red-500">{scrapeError}</p>}
        {urlError && <p className="text-red-500">{urlError}</p>}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isScraping || scrapeSuccess}
            className="dark:text-textColor-light"
          >
            {isScraping
              ? "Importing..."
              : scrapeSuccess
              ? "Import complete"
              : "Import"}
          </Button>
        </div>
      </form>
    </ReusableModal>
  );
}

const ScrapeButton = forwardRef<
  HTMLButtonElement,
  { setIsOpen: (open: boolean) => void }
>(({ setIsOpen }, ref) => (
  <Button
    ref={ref}
    onClick={() => setIsOpen(true)}
    className="dark:text-textColor-light"
  >
    Get Recipe from URL
  </Button>
));

ScrapeButton.displayName = "ScrapeButton";

function isValidUrl(url: string) {
  const urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[-a-z\\d_]*)?$",
    "i" // fragment locator
  );
  return !!urlPattern.test(url);
}
