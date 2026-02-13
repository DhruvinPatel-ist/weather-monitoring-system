"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { IconGeneral } from "@/icons/setting/IconGeneral";
import { IconWidgets } from "@/icons/setting/IconWidgets";
import { IconCharts } from "@/icons/setting/IconCharts";
import { IconNotes } from "@/icons/setting/IconNotes";
import { IconImages } from "@/icons/setting/IconImages";
import { IconQr } from "@/icons/setting/IconQr";

type Tab = {
  id: string;
  label: string;
};

type NavigationTabsProps = {
  tabs: Tab[];
  tabContents: Record<string, React.ReactNode>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export function NavigationTabs({
  tabs,
  tabContents,
  activeTab,
  onTabChange,
}: NavigationTabsProps) {
  return (
    <div>
      <div className="flex mb-2 p-2 w-full overflow-y-auto gap-4 hide-scrollbar">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
      <div>{tabContents[activeTab]}</div>
    </div>
  );
}

function TabButton({
  id,
  label,
  isActive,
  onClick,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 p-1 rounded-md bg-white transition-colors",
        isActive ? "bg-blue3 text-white" : "text-black bg-white"
      )}
    >
      <TabIcon id={id} isActive={isActive} />
      <span className="text-md">{label}</span>
    </button>
  );
}

function TabIcon({ id, isActive }: { id: string; isActive: boolean }) {
  const color = isActive ? "white" : "gray";

  switch (id) {
    case "general":
      return <IconGeneral color={color} className="!h-5 !w-5" />;
    case "widgets":
      return <IconWidgets color={color} className="!h-6 !w-6" />;
    case "charts":
      return <IconCharts color={color} className="!h-5 !w-5" />;
    case "notes":
      return <IconNotes color={color} className="!h-5 !w-5" />;
    case "images":
      return <IconImages color={color} className="!h-6 !w-6" />;
    case "qr-info":
      return <IconQr color={color} className="!h-6 !w-6" />;
    default:
      return <IconGeneral color={color} className="h-5 w-5" />;
  }
}
