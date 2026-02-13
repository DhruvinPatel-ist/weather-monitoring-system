"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { ConfigurationsHeader } from "@/components/configurations/configurations-header";
import { NavigationTabs } from "@/components/configurations/navigation-tabs";
import { WidgetsContent } from "@/components/configurations/widgets-content";
import { GeneralContent } from "@/components/configurations/general-content";
import { ChartsContent } from "@/components/configurations/charts-content";
import { NotesContent } from "@/components/configurations/notes-content";
import { ImagesContent } from "@/components/configurations/images-content";
import { QrInfoContent } from "@/components/configurations/qr-info-content";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import useControl from "@/hooks/useControl";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations, useLocale } from "next-intl";

export default function SettingPage() {
  const { isAdmin, isLoading } = useControl();
  const router = useRouter();
  const isMobileOrTablet = useDeviceDetection();
  const t = useTranslations("SettingsPage");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState("general");

  const generalRef = useRef<{ handleSave: () => void }>(null);
  const notesRef = useRef<{ handleSave: () => void }>(null);
  const imagesRef = useRef<{ handleSave: () => void }>(null);
  const qrInfoRef = useRef<{ handleSave: () => void }>(null);
  const widgetsRef = useRef<{ handleSave: () => void }>(null);
  const chartsRef = useRef<{ handleSave: () => Promise<void> }>(null);

  const contentRefs = {
    general: generalRef,
    notes: notesRef,
    images: imagesRef,
    "qr-info": qrInfoRef,
    widgets: widgetsRef, // <--- added
    charts: chartsRef,
  };

  const handleSave = async () => {
    console.log(`Saving content for tab: ${activeTab}`);
    const ref = contentRefs[activeTab as keyof typeof contentRefs];
    if (ref?.current?.handleSave) {
      return ref.current.handleSave();
    }
    return Promise.resolve();
  };

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-[60px] w-full mb-4 rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <MainLayout>
      <div
        className={`p-2 bg-white1 rounded-2xl h-full ${
          isMobileOrTablet ? "overflow-auto p-3" : ""
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <ConfigurationsHeader activeTab={activeTab} onSave={handleSave} />
        <NavigationTabs
          tabs={[
            { id: "general", label: t("General") },
            { id: "widgets", label: t("Widgets") },
            { id: "charts", label: t("Charts") },
            { id: "notes", label: t("Notes") },
            { id: "images", label: t("Images") },
            { id: "qr-info", label: t("QR_Info") },
          ]}
          tabContents={{
            general: <GeneralContent ref={generalRef} />,
            widgets: <WidgetsContent ref={widgetsRef} />,
            charts: <ChartsContent ref={chartsRef} />,
            notes: <NotesContent />,
            images: <ImagesContent />,
            "qr-info": <QrInfoContent />,
          }}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </MainLayout>
  );
}
