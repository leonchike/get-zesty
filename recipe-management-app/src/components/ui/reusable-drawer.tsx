"use client";

import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}
export function ReusableDrawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: DrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      {/* <DrawerTrigger>
        <FilterButton />
      </DrawerTrigger> */}
      <DrawerContent className="bg-pageBg-light dark:bg-pageBg-dark border-none shadow-none rounded-t-[2rem]">
        <DrawerHeader>
          {title && <DrawerTitle>{title}</DrawerTitle>}
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        {/* <DrawerFooter>
          <DrawerClose>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter> */}
        {children}
      </DrawerContent>
    </Drawer>
  );
}
