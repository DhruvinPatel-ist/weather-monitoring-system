"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTranslations } from "next-intl";

// Delete Confirmation Dialog Props
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  title?: string;
}

// ✅ Delete Confirmation Dialog
export function ConfirmDeleteModal({
  isOpen,
  onConfirm,
  onCancel,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmLabel = "Delete",
}: ConfirmDeleteModalProps) {
  const t = useTranslations("FTPConfiguration");

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="p-0 max-w-md rounded-md shadow-lg">
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>
        <div className="p-6">
          <div className="flex justify-start mb-4">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  fill="#F8E7E7"
                  stroke="#E53935"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 8V12"
                  stroke="#E53935"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16H12.01"
                  stroke="#E53935"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-start text-lg font-medium text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-start text-sm text-gray-500">{description}</p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              {t("cancel")}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ✅ Success Dialog
export function SuccessDialog({
  isOpen,
  onClose,
  message = "Item deleted successfully",
  title = "Success",
}: SuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-md rounded-md shadow-lg">
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>
        <div className="p-6 relative">
          <div className="flex justify-center mb-6 mt-4">
            <div className={title=='User details Added Successfully'?"h-16 w-16 rounded-full bg-green-500 flex items-center justify-center":"h-16 w-16 rounded-full bg-red-500 flex items-center justify-center"}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 13L9 17L19 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-1">{title}</h2>
            <p className="text-base text-gray-700">{message}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
