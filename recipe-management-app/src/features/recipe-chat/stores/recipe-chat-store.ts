"use client";

import { create } from "zustand";
import { Recipe } from "@prisma/client";

export type MessageType = "text" | "recipe";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: MessageType;
  recipeData?: Recipe;
  timestamp: Date;
}

interface RecipeChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentRecipe: Recipe | null;
  hasGeneratedRecipe: boolean;
  
  // Actions
  setIsOpen: (isOpen: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  clearChat: () => void;
}

export const useRecipeChatStore = create<RecipeChatState>((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  error: null,
  currentRecipe: null,
  hasGeneratedRecipe: false,
  
  setIsOpen: (isOpen) => set((state) => {
    if (!isOpen) {
      // Clear chat when closing
      return {
        isOpen: false,
        messages: [],
        error: null,
        currentRecipe: null,
        hasGeneratedRecipe: false,
      };
    }
    return { isOpen };
  }),
  
  addMessage: (message) => set((state) => {
    const newState: Partial<RecipeChatState> = {
      messages: [...state.messages, message],
    };
    
    if (message.type === "recipe" && message.recipeData) {
      newState.currentRecipe = message.recipeData;
      newState.hasGeneratedRecipe = true;
    }
    
    return newState;
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
  
  clearChat: () => set({
    messages: [],
    error: null,
    currentRecipe: null,
    hasGeneratedRecipe: false,
  }),
}));