"use client";

import clsx from "clsx";

interface MemberAvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md";
  className?: string;
}

export function MemberAvatar({
  name,
  color,
  size = "sm",
  className,
}: MemberAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      title={name}
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-medium text-white select-none flex-shrink-0",
        size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm",
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initial}
    </span>
  );
}
