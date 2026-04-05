"use client";

import React, { useEffect, useRef } from "react";
import { useRecipeChatStore } from "../stores/recipe-chat-store";
import { RecipeMessage } from "./recipe-message";
import { TextMessage } from "./text-message";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function MessageList() {
  const { messages, isLoading, error } = useRecipeChatStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.length === 0 && (
        <div className="text-center text-textGray-light dark:text-textGray-dark mt-8">
          <p className="text-lg font-medium mb-2 text-textColor-light dark:text-textColor-dark">Welcome to AI Recipe Assistant!</p>
          <p className="text-sm">
            Ask me to create a recipe, get cooking advice, or help modify recipes.
          </p>
        </div>
      )}
      
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.type === "recipe" && message.recipeData ? (
            <RecipeMessage message={message} />
          ) : (
            <TextMessage message={message} />
          )}
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-center space-x-2 bg-inputGray-light dark:bg-primaryHover-dark rounded-lg px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-textGray-light dark:text-textGray-dark" />
            <span className="text-sm text-textGray-light dark:text-textGray-dark">Thinking...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex justify-center">
          <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}