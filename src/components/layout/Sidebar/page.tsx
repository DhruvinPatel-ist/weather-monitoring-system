"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { DashboardIcon } from "@/icons/sidebar/DashboardIcon";
import { AiIcon } from "@/icons/sidebar/AiIcon";
import { SettingIcon } from "@/icons/sidebar/SettingIcon";
import { ReportIcon } from "@/icons/sidebar/ReportIcon";
import { X } from "lucide-react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { ProfileIcon } from "@/icons/sidebar/ProfileIcon";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import useControl from "@/hooks/useControl";
import { LogoutModal } from "@/components/logout/logout-modal";
import { useState } from "react";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const t = useTranslations("Navigation");
  const tAuth = useTranslations("Auth");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const isMobileOrTablet = useDeviceDetection();
  const { isAdmin } = useControl();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (route: string) => {
    const normalizedRoute = route.replace(/^\//, "").toLowerCase();
    const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), "");
    const normalizedPath = pathWithoutLocale.replace(/^\//, "").toLowerCase();

    return (
      normalizedPath === normalizedRoute ||
      normalizedPath.startsWith(`${normalizedRoute}/`) ||
      (normalizedRoute === "dashboard" && normalizedPath === "")
    );
  };

  const handleNavigation = (route: string) => {
    router.push(route);
    if (isMobileOrTablet && onClose) {
      onClose();
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  if (isMobileOrTablet) {
    return (
      <>
        <div className="w-full h-full backdrop-blur-xs">
          <div
            className="fixed right-0 h-full bg-white z-50 flex flex-col items-center justify-start pt-10 w-xs rounded-tl-lg"
            data-sidebar="true"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="flex flex-col items-center gap-8 mt-10 w-full px-4">
              <Button
                variant="ghost"
                className="flex items-center gap-4 w-full justify-start px-8 py-4"
                onClick={() => handleNavigation("/dashboard")}
              >
                <DashboardIcon
                  color={isActive("/dashboard") ? "var(--color-blue3)" : "gray"}
                  className="!h-6 !w-6"
                />
                <span>{t("Dashboard")}</span>
              </Button>

              <Button
                variant="ghost"
                className="flex items-center gap-4 w-full justify-start px-8 py-4"
                onClick={() => handleNavigation("/Report")}
              >
                <ReportIcon
                  color={isActive("/Report") ? "var(--color-blue3)" : "gray"}
                  className="!h-6 !w-6"
                />
                <span>{t("Reports")}</span>
              </Button>

              {isAdmin && (
                <Button
                  variant="ghost"
                  className="flex items-center gap-4 w-full justify-start px-8 py-4"
                  onClick={() => handleNavigation("/Setting")}
                >
                  <SettingIcon
                    color={isActive("/Setting") ? "var(--color-blue3)" : "gray"}
                    className="!h-6 !w-6"
                  />
                  <span>{t("Settings")}</span>
                </Button>
              )}

              <Button
                variant="ghost"
                className="flex items-center gap-4 w-full justify-start px-8 py-4"
                onClick={() => handleNavigation("/chat")}
              >
                <AiIcon
                  color={isActive("/chat") ? "var(--color-blue3)" : "gray"}
                  className="!h-8 !w-8"
                />
                <span>AI Insight</span>
              </Button>

              <Button
                variant="ghost"
                className="flex items-center gap-4 w-full justify-start px-8 py-4"
                onClick={() => handleNavigation("/profile")}
              >
                <ProfileIcon
                  color={isActive("/profile") ? "var(--color-blue3)" : "gray"}
                  className="!h-8 !w-8"
                />
                <span>{t("Profile")}</span>
              </Button>

              <Button
                variant="ghost"
                className="flex items-center gap-4 w-full justify-start px-4 py-4"
                onClick={handleLogoutClick}
              >
                <Image
                  src="/assets/sidebar/logout.svg"
                  alt="Logout"
                  className="h-6 w-6"
                  width={20}
                  height={20}
                />
                <span>{tAuth("Logout")}</span>
              </Button>
            </div>
          </div>
        </div>

        {showLogoutModal && (
          <LogoutModal
            open={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="w-20 lg:w-[74px] h-screen flex flex-col items-center bg-white rounded-2xl static overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="w-10 h-10 mb-8 mt-4 flex items-center justify-center">
          <Image
            src="/assets/sidebar/logo.svg"
            width={20}
            height={20}
            alt="Logo"
            className="w-8 h-8"
          />
        </div>

        <div className="flex flex-col max-h-screen gap-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
            title={t("Dashboard")}
          >
            <DashboardIcon
              color={isActive("/dashboard") ? "var(--color-blue3)" : "gray"}
              className="!h-6 !w-6"
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/Report")}
            title={t("Reports")}
          >
            <ReportIcon
              color={isActive("/Report") ? "var(--color-blue3)" : "gray"}
              className="!h-6 !w-6"
            />
          </Button>

          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/Setting")}
              title={t("Settings")}
            >
              <SettingIcon
                color={isActive("/Setting") ? "var(--color-blue3)" : "gray"}
                className="!h-6 !w-6"
              />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/chat")}
            title="AI Insight"
          >
            <AiIcon
              color={isActive("/chat") ? "var(--color-blue3)" : "gray"}
              className="!h-8 !w-8"
            />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogoutClick}
            title={tAuth("Logout")}
          >
            <Image
              src="/assets/sidebar/logout.svg"
              alt="Logout"
              className="h-5 w-5"
              width={20}
              height={20}
            />
          </Button>
        </div>
      </div>

      {showLogoutModal && (
        <LogoutModal
          open={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
}
