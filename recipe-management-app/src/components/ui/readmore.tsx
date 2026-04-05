"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

const ReadMore = ({
  children,
  lines = 3,
}: {
  children: React.ReactNode;
  lines?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseInt(
        getComputedStyle(contentRef.current).lineHeight
      );
      const maxHeight = lineHeight * lines;
      setShowButton(contentRef.current.scrollHeight > maxHeight);
    }
  }, [children, lines]);

  return (
    <div>
      <div
        ref={contentRef}
        className={`${
          expanded ? "" : `line-clamp-${lines}`
        } text-sm tracking-wide leading-6 whitespace-pre-line overflow-hidden`}
        style={expanded ? {} : { maxHeight: `${lines * 1.5 + 0.5}em` }}
      >
        {children}
      </div>
      {showButton && (
        <Button
          onClick={() => setExpanded(!expanded)}
          variant="link"
          className="text-brandBlue-light dark:text-brandBlue-dark hover:text-brandBlue-light dark:hover:text-brandBlue-dark text-sm mt-1 focus:outline-none pl-0"
        >
          {expanded ? "Read less" : "Read more"}
        </Button>
      )}
    </div>
  );
};

export { ReadMore };
