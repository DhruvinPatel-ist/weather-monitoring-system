"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useTranslations } from "next-intl";
import { useUserStore } from "@/stores/useUserStore";
import useChat from "@/hooks/useChat";

interface LogoutModalProps {
  open?: boolean;
  onClose?: () => void;
}

export function LogoutModal({ open = true, onClose }: LogoutModalProps) {
  const t = useTranslations("Auth");
  const [isOpen, setIsOpen] = useState(open);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { isMobile, isTablet } = useDeviceDetection() as unknown as {
    isMobile: boolean;
    isTablet: boolean;
  };
  const isMobileOrTablet = isMobile || isTablet;
  const resetUser = useUserStore.getState().resetUser;
  const { clearUserSession } = useChat();

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // ✅ Clear Zustand
      resetUser();

      // ✅ Clear React Query cache
      localStorage.clear();
      sessionStorage.clear();

      // ✅ Clear chat/session data from memory
      clearUserSession();

      // Clear any custom cookies (you can add more specific ones if needed)
      const cookiesToClear = [
        "next-auth.session-token",
        "next-auth.csrf-token",
        "next-auth.callback-url",
        "__Secure-next-auth.session-token",
        "__Host-next-auth.csrf-token",
      ];

      cookiesToClear.forEach((cookieName) => {
        // Clear for current domain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        // Clear for localhost specifically
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
        // Clear for any subdomain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`;
      });

      // Use NextAuth signOut to properly clear session
      await signOut({
        redirect: true, // We'll handle redirect manually
        callbackUrl: "/", // or wherever you want to redirect
      });
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`z-50 sm:max-w-md backdrop-blur ${
          isMobileOrTablet ? "w-xs" : "w-md"
        }`}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-col gap-4 items-start">
          <Image
            src="/assets/logout/logout.svg"
            width={40}
            height={40}
            alt="Logout Icon"
          />
          <DialogTitle>{t("Logout?")}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t("Are you sure you want to Logout?")}
        </DialogDescription>
        <div className="flex w-full justify-between gap-2 mt-4">
          <div className="w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              className="w-full"
              disabled={isLoggingOut}
            >
              {t("Cancel", { defaultMessage: "Cancel" })}
            </Button>
          </div>
          <div className="w-full">
            <Button
              onClick={handleLogout}
              className="w-full bg-blue3 hover:bg-[#008a96]"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>
                    {t("Logging out", { defaultMessage: "Logging out..." })}
                  </span>
                </div>
              ) : (
                t("Logout")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
