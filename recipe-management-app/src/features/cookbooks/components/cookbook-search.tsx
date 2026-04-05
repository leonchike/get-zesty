"use client";

import { Search } from "lucide-react";

export default function CookbookSearch({
  value,
  onChange,
  placeholder = "Search recipes...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-borderGray-light dark:border-borderGray-dark bg-pageBg-light dark:bg-pageBg-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark"
      />
    </div>
  );
}
