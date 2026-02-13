"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface PasswordSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordSuccessModal({
  isOpen,
  onClose,
}: PasswordSuccessModalProps) {
  const t = useTranslations("ForgotPassword");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-sm shadow-lg">
        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center px-6 pb-8 text-center">
          <div className="bg-[#e1f1f2] rounded-full mb-4">
            <Image
              src="/Setting/success.svg"
              alt="Success"
              width={30}
              height={30}
              className="h-30 w-30"
            />
          </div>

          <h2 className="text-2xl font-semibold mb-2">
            {t("Password has been updated Successfully")}
          </h2>

          <p className="text-gray-600 text-xs">
            {t("Please, use your new password when signing in")}
          </p>
        </div>
      </div>
    </div>
  );
}
