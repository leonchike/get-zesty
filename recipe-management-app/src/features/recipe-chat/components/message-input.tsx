"use client";

import React, { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useRecipeChatStore } from "../stores/recipe-chat-store";
import { useRecipeChat } from "../hooks/useRecipeChat";

export function MessageInput() {
  const [input, setInput] = useState("");
  const { isLoading, addMessage } = useRecipeChatStore();
  const { mutate: sendMessage } = useRecipeChat();
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (trimmedInput && !isLoading) {
      // Add user message immediately
      const userMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        content: trimmedInput,
        type: "text" as const,
        timestamp: new Date(),
      };
      
      addMessage(userMessage);
      sendMessage(trimmedInput);
      setInput("");
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-borderGray-light dark:border-borderGray-dark bg-pageBg-light dark:bg-pageBg-dark">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about recipes or cooking..."
          disabled={isLoading}
          className="flex-1 bg-inputGray-light dark:bg-primaryHover-dark border-borderGray-light dark:border-borderGray-dark text-textColor-light dark:text-textColor-dark placeholder:text-textGray-light dark:placeholder:text-textGray-dark"
          autoFocus
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          size="icon"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </form>
  );
}