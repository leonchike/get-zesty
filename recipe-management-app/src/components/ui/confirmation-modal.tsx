import React from "react";
import { Modal } from "@/components/ui/reusable-modal-v2";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      <div className="mt-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant="destructive" onClick={handleConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
