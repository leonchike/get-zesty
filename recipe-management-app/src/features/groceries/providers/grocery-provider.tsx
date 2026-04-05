"use client";

import { useGroceryItemsQuery } from "@/features/groceries/hooks/grocery-query-hooks";

/**
 * GroceryProvider component
 *
 * This component sets up a background query to fetch grocery items every 5 minutes.
 * It's used to keep the grocery data up-to-date across the application.
 *
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - The child components to render
 * @returns {React.ReactNode} The wrapped children components
 */
export function GroceryProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  // Set up a query to fetch grocery items every 5 minutes (300000 milliseconds)
  useGroceryItemsQuery(1000 * 60 * 5);

  // Render the children components
  return <>{children}</>;
}
