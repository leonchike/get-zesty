"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";
import clsx from "clsx";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function NavLink({
  href,
  children,
  className = "",
  onClick,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <div className="relative">
      {/* Active pill indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
      )}
      <Link
        href={href}
        className={clsx(
          "flex items-center p-2 pl-4 rounded-lg transition-all duration-200",
          "hover:bg-primary/5",
          {
            "text-primary font-medium bg-primary/5": isActive,
            "text-muted-foreground": !isActive,
          },
          className
        )}
        onClick={onClick}
      >
        {children}
      </Link>
    </div>
  );
}
