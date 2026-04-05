"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteCookbookAction } from "../actions/cookbook-actions";
import ROUTES from "@/lib/constants/routes";

interface DeleteCookbookDialogProps {
  cookbookId: string;
  cookbookTitle: string;
  recipeCount: number;
}

export default function DeleteCookbookDialog({
  cookbookId,
  cookbookTitle,
  recipeCount,
}: DeleteCookbookDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCookbookAction(cookbookId);
      router.push(ROUTES.COOKBOOKS);
    } catch (error) {
      console.error("Failed to delete cookbook:", error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-gray-500 hover:text-red-500"
        aria-label="Delete cookbook"
      >
        <Trash2 className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cookbook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{cookbookTitle}&rdquo;?
              This will permanently remove the cookbook and all {recipeCount}{" "}
              {recipeCount === 1 ? "recipe" : "recipes"}, including embeddings.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
