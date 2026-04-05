import React from "react";

interface H1Props {
  children: React.ReactNode;
  className?: string;
}

export const H1 = ({ children, className = "" }: H1Props) => {
  return (
    <h1
      className={`select-none font-heading text-3xl md:text-4xl font-medium mb-6 text-foreground tracking-tight ${className}`}
    >
      {children}
    </h1>
  );
};
