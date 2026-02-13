import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function ConfigurationsHeader({
  activeTab,
  onSave,
}: {
  activeTab: string;
  onSave: () => Promise<void>;
}) {
  const t = useTranslations("SettingsPage");
  const [isSaving, setIsSaving] = useState(false);
  const hideSaveButton =
    activeTab === "images" || activeTab === "notes" || activeTab === "qr-info";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      // Reset the saving state after a short delay
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  };

  return (
    <div className="flex items-center justify-between mb-2">
      <h1 className="text-2xl font-semibold">{t("Configurations")}</h1>
      {!hideSaveButton && (
        <Button
          className="bg-blue-400 text-white hover:bg-blue-600"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? t("saving") : t("saveChanges")}
        </Button>
      )}
    </div>
  );
}
