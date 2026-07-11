"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCreateTask } from "@/features/home-tasks/hooks/home-tasks-query-hooks";
import { useHomeTasksStore } from "@/features/home-tasks/stores/home-tasks-store";

export default function AddTaskInput() {
  const { inputValue, setInputValue } = useHomeTasksStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateTask();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    createMutation.mutate({ title: inputValue.trim() });
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Add a task, e.g. “Clean HVAC filters”…"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="w-full px-4 py-2 pr-24 h-12 border border-border bg-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 text-sm text-foreground placeholder:text-muted-foreground"
      />
      <Button
        type="submit"
        disabled={createMutation.isPending || !inputValue.trim()}
        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 bg-foreground hover:bg-foreground/90 rounded-md px-4 py-2 transition-opacity duration-200"
      >
        <span className="text-background text-sm font-medium">
          {createMutation.isPending ? "Adding…" : "Add"}
        </span>
      </Button>
    </form>
  );
}
