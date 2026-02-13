"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import Image from "next/image";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { LanguageToggle } from "@/components/Auth/language-toggle";
import { useUserInfo } from "@/hooks/useDashboard";
import { useUserStore } from "@/stores/useUserStore";
import { useEffect, useState } from "react";
import useControl from "@/hooks/useControl";
import { useTranslations } from "next-intl";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { userId } = useControl();
  const router = useRouter();
  const isMobileOrTablet = useDeviceDetection();
  const { userInfo } = useUserStore();
  const { isLoading, refetch } = useUserInfo(userId); // Triggers fetch and Zustand sync
  const t = useTranslations("Header");

  // Force refetch on mount
  useEffect(() => {
    refetch();
  }, [userInfo]);

  const title = t("title");

  const currentDateWithDay = (): string => {
    const now = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const dayName = days[now.getDay()];
    const date = String(now.getDate()).padStart(2, "0");
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();

    return `${dayName}, ${date} ${monthName} ${year}`;
  };

  // Hydration fix: only render date on client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  const date = isClient ? currentDateWithDay() : "";
  const profileImage = userInfo?.profile_picture
    ? userInfo.profile_picture.startsWith("data:image/")
      ? userInfo.profile_picture
      : `data:image/jpeg;base64,${userInfo.profile_picture}`
    : "/assets/header/profile.svg";
  const profileName = userInfo?.firstname || "Guest";

  return (
    <header
      className={`${
        isMobileOrTablet
          ? "bg-transparent flex flex-col items-center"
          : " py-0 mb-2 my-2"
      } flex items-center justify-between`}
    >
      {isMobileOrTablet ? (
        <div className="flex flex-row justify-between w-full bg-white py-2">
          <div className="flex items-center ml-5">
            <Image
              src="/assets/header/mobileHeader.svg"
              alt="Authority Logo"
              width={200}
              height={200}
            />
          </div>
          <div className="flex items-center gap-3 pr-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/notification")}
            >
              <Image
                src="/assets/header/bell.svg"
                alt="Notifications"
                width={20}
                height={20}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="p-0"
              onClick={onMenuToggle}
            >
              <Image
                src="/assets/header/mobileMenu.svg"
                alt="Menu"
                width={20}
                height={20}
              />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center h-10 mr-4">
            <div className="pl-6">
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mr-3 ml-4">
            <LanguageToggle className="bg-transparent text-black border-1 border-gray-400 hover:bg-white1 hover:text-black" />
            <Button
              variant="ghost"
              size="icon"
              className="bg-white rounded-full"
              onClick={() => router.push("/notification")}
            >
              <Image
                src="/assets/header/bell.svg"
                alt="Notifications"
                width={20}
                height={20}
              />
            </Button>

            {isLoading ? (
              <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-2xl animate-pulse">
                <div className="h-8 w-8 rounded-full bg-gray-300" />
                <div className="h-4 w-16 bg-gray-300 rounded-md" />
              </div>
            ) : (
              <Button
                variant="ghost"
                className="flex items-center justify-between gap-2 rounded-2xl bg-white px-1 py-1 hover:bg-gray-200"
                onClick={() => router.push("/profile")}
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-full">
                  <Image
                    src={profileImage}
                    alt="Admin Profile"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <span className="text-sm font-medium mr-1">{profileName}</span>
              </Button>
            )}
          </div>
        </>
      )}

      {isMobileOrTablet && (
        <div className="w-full bg-[#e6edef] px-4 mt-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
      )}
    </header>
  );
}
