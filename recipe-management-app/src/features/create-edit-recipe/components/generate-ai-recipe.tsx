"use client";

import { Button } from "@/components/ui/button";
import { SparklesIcon } from "@/components/ui/icons/custom-icons";
import { useRecipeChatStore } from "@/features/recipe-chat/stores/recipe-chat-store";
import { RecipeChatModal } from "@/features/recipe-chat/components/chat-modal";

export function GenerateAIRecipe() {
  const { setIsOpen } = useRecipeChatStore();

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-[#FF385C] to-[#E22556] hover:opacity-90 dark:text-textColor-dark"
      >
        Generate AI Recipe
        <SparklesIcon className="ml-2" />
      </Button>
      <RecipeChatModal />
    </>
  );
}
