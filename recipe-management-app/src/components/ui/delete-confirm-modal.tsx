import React from "react";
import { useModal } from "@/hooks/useModal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  text: string;
  onDelete: () => void;
  children: React.ReactNode;
}

export function DeleteConfirmModal({
  text,
  onDelete,
  children,
}: DeleteConfirmModalProps) {
  const { isOpen, open, close } = useModal();

  const handleDelete = () => {
    onDelete();
    close();
  };

  return (
    <>
      <div onClick={open}>{children}</div>
      <ConfirmationModal
        isOpen={isOpen}
        onClose={close}
        onConfirm={handleDelete}
        title="Delete Recipe"
        description={text}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
