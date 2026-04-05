import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ReusableModalProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  width?:
    | "default"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "full";
  allowClose?: boolean;
  triggerClose?: boolean;
}

export function ReusableModal({
  trigger,
  title,
  description,
  children,
  footer,
  onOpenChange,
  width = "default",
  allowClose = true,
  triggerClose = true,
}: ReusableModalProps) {
  const widthClasses = {
    default: "sm:max-w-lg",
    xs: "sm:max-w-xs",
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    "3xl": "sm:max-w-3xl",
    "4xl": "sm:max-w-4xl",
    "5xl": "sm:max-w-5xl",
    full: "sm:max-w-full",
  };

  return (
    <Dialog
      onOpenChange={allowClose ? onOpenChange : undefined}
      open={triggerClose ? triggerClose : undefined}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          widthClasses[width],
          "w-full dark:bg-pageBg-dark shadow-none border-none dark:outline-none dark:shadow-none dark:ring-0"
        )}
      >
        {(title || description) && (
          <DialogHeader className="space-y-3">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription className="text-sm dark:text-textColor-dark/80">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// Example usage
export function ExampleModalUsage() {
  return (
    <ReusableModal
      trigger={<Button>Open Modal</Button>}
      title="Example Modal"
      description="This is an example of the improved reusable modal component."
      footer={
        <Button onClick={() => console.log("Action taken")}>Confirm</Button>
      }
      onOpenChange={(open) => console.log("Modal is", open ? "open" : "closed")}
    >
      <p>This is the main content of the modal.</p>
    </ReusableModal>
  );
}
