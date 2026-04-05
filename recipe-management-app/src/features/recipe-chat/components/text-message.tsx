"use client";

import React from "react";
import { ChatMessage } from "../stores/recipe-chat-store";
import { cn } from "@/lib/utils";

interface TextMessageProps {
  message: ChatMessage;
}

export function TextMessage({ message }: TextMessageProps) {
  return (
    <div
      className={cn(
        "max-w-[70%] rounded-lg px-4 py-2",
        message.role === "user"
          ? "bg-pageBg-dark dark:bg-pageBg-light text-textColor-dark dark:text-textColor-light ml-auto"
          : "bg-inputGray-light dark:bg-primaryHover-dark text-textColor-light dark:text-textColor-dark"
      )}
    >
      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
    </div>
  );
}