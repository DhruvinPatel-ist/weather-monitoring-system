"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar/page";
import { Header } from "@/components/layout/Header/page";
import { useState, useEffect } from "react";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useParams } from "next/navigation";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const isRTL = locale === "ar";

  const isMobileOrTablet = useDeviceDetection();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Close sidebar when clicking outside (mobile/tablet only)
  useEffect(() => {
    if (!isMobileOrTablet) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isSidebarOpen && !target.closest('[data-sidebar="true"]')) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isSidebarOpen, isMobileOrTablet]);

  return (
    <div className="h-screen overflow-hidden w-full bg-gray1">
      {!isMobileOrTablet && (
        <div
          className={`fixed inset-y-0 ${isRTL ? "right-0" : "left-0"} block`}
        >
          <div
            className={`flex flex-col h-screen justify-center items-center ${
              isRTL ? "p-2 pl-0" : "p-2 pr-0"
            } py-2`}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {isMobileOrTablet && isSidebarOpen && (
        <div className="fixed inset-0 z-50" data-sidebar="true">
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>
      )}

      <div
        className={`flex flex-1 flex-col ${
          isMobileOrTablet ? "mx-0" : isRTL ? "mr-20" : "ml-20"
        }`}
      >
        <Header onMenuToggle={toggleSidebar} />
        <main
          className={`pb-0 flex justify-center ${
            isMobileOrTablet ? "h-[calc(100vh-130px)]" : "h-[calc(100vh-60px)]"
          }`}
        >
          <div
            className={`h-full w-full p-2 ${
              isMobileOrTablet
                ? "mx-4 w-full h-full"
                : isRTL
                ? "mr-2 ml-2"
                : "ml-2 mr-2"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
