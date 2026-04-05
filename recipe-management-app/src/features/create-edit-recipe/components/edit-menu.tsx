"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "@/components/ui/icons/custom-icons";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { Button } from "@/components/ui/button";
import { deleteRecipeAction } from "@/lib/actions/recipe-actions";
import ROUTES from "@/lib/constants/routes";

export function MoreMenu({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      await deleteRecipeAction(id);
      toast.success("Recipe has been deleted");
      router.push(ROUTES.HOME);
      router.refresh();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Error deleting recipe");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <DeleteConfirmModal
            text="Are you sure you want to delete this recipe?"
            onDelete={handleDelete}
          >
            <Button variant="ghost" className="w-full justify-start">
              Delete
            </Button>
          </DeleteConfirmModal>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
