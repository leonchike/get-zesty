"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRecipeChatStore } from "../stores/recipe-chat-store";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

export function RecipeChatModal() {
  const { isOpen, setIsOpen } = useRecipeChatStore();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="h-[90vh] max-w-4xl flex flex-col p-0 gap-0 bg-pageBg-light dark:bg-pageBg-dark border-borderGray-light dark:border-borderGray-dark">
        <DialogHeader className="px-6 py-4 border-b border-borderGray-light dark:border-borderGray-dark">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-textColor-light dark:text-textColor-dark">
              AI Recipe Assistant
            </DialogTitle>
          </div>
        </DialogHeader>

        <MessageList />
        <MessageInput />
      </DialogContent>
    </Dialog>
  );
}
