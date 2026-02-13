"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, X, ArrowRight } from "lucide-react";
import bcrypt from "bcryptjs";
import { UserService } from "@/services/userService"; // your existing api
import { useUserInfoHeader } from "@/hooks/useDashboard"; // to get userId
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PasswordChangeModal({
  isOpen,
  onClose,
  onSuccess,
}: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("MyAccount");

  const { data: userInfo, refetch } = useUserInfoHeader();

  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!userInfo?.id) {
      setError("User not loaded");
      return;
    }

    try {
      // 🔵 Hash password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 🔵 Call your API to update user
      await UserService.updateUserInfo(userInfo.id.toString(), {
        password: hashedPassword,
      });

      // 🔵 Show success
      toast.success("Password updated successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to update password");
      console.error("Failed to update password", error);
      setError("Failed to update password");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">{t("Change Password")}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5 bg-gray-500 rounded-full text-white p-1" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6" autoComplete="off">
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-sm font-medium">
              {t("Enter New Password")}
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue3"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <Eye /> : <EyeOff />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium"
            >
              {t("Re-type New Password")}
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue3"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 ltr:right-0 rtl:left-0 ltr:pr-3 rtl:pl-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <Eye /> : <EyeOff />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue3 text-white py-3 px-4 rounded-md hover:bg-[#008a99]"
          >
            {t("Continue")}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
