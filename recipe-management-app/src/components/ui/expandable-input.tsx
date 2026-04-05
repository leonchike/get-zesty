// components/ui/auto-expand-textarea.tsx

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface AutoExpandTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: string;
}

export const AutoExpandTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoExpandTextareaProps
>(({ className, value, onChange, minHeight = "120px", ...props }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(
        textarea.scrollHeight,
        parseInt(minHeight)
      )}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    adjustHeight();
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, [value, adjustHeight]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight, onChange]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(event);
    }
    adjustHeight();
  };

  const handleFocus = () => {
    adjustHeight();
  };

  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primaryHover-dark dark:border-primaryHover-dark dark:text-textColor-dark dark:placeholder:text-textColor-dark/80 dark:focus:ring-pageBg-light overflow-y-scroll",
        className
      )}
      style={{ minHeight, resize: "none", overflow: "hidden" }}
      ref={(node) => {
        // @ts-ignore
        textareaRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      value={value}
      onChange={handleChange}
      onInput={adjustHeight}
      onFocus={handleFocus}
      {...props}
    />
  );
});

AutoExpandTextarea.displayName = "AutoExpandTextarea";
