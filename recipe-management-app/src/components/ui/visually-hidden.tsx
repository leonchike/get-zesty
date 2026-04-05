import React from "react";

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
}

export const VisuallyHidden = ({
  children,
  as: Component = "span",
}: VisuallyHiddenProps) => {
  const Element = Component as React.ElementType;
  return (
    <Element
      style={{
        border: 0,
        clip: "rect(0 0 0 0)",
        height: "1px",
        margin: "-1px",
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        width: "1px",
        whiteSpace: "nowrap",
        wordWrap: "normal",
      }}
    >
      {children}
    </Element>
  );
};
