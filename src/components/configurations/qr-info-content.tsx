"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextEditorField } from "./text-editor-field";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerClose,
} from "@/components/ui/drawer";
import { QrCode, X, Download } from "lucide-react";
import * as QRCode from "qrcode";
import Image from "next/image";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function QrInfoContent() {
  const isMobileOrTablet = useDeviceDetection();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [text, setText] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const t = useTranslations();
  // const locale = useLocale();

  // Enhanced function to strip HTML tags and decode HTML entities
  const stripHtmlTags = (html: string): string => {
    if (!html) return "";

    try {
      // Method 1: Using DOMParser (more reliable)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      let textContent = doc.body.textContent || doc.body.innerText || "";

      // If DOMParser didn't work well, try the div method
      if (!textContent || textContent === html) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        textContent = tempDiv.textContent || tempDiv.innerText || "";
      }

      // If still contains HTML tags, use regex as fallback
      if (textContent.includes("<") && textContent.includes(">")) {
        textContent = html.replace(/<[^>]*>/g, "");
      }

      // Decode HTML entities
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = textContent;
      textContent = tempDiv.textContent || tempDiv.innerText || textContent;

      // Clean up extra whitespace and line breaks
      return textContent.replace(/\s+/g, " ").trim();
    } catch (error) {
      console.error("Error stripping HTML tags:", error);
      // Fallback: simple regex replacement
      return html
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }
  };

  const generateQRCode = async () => {
    const MAX_CHAR_LIMIT = 2000;

    // Strip HTML tags from the text before generating QR code
    const cleanText = stripHtmlTags(text);

    // Debug log to see what we're working with
    console.log("Original text:", text);
    console.log("Cleaned text:", cleanText);

    if (cleanText.length > MAX_CHAR_LIMIT) {
      toast.error(
        `${t("SettingsPage.textTooLong")} ${MAX_CHAR_LIMIT} ${t(
          "SettingsPage.characters"
        )}`
      );
      return;
    }

    try {
      // Use cleaned text or default text for QR generation
      const url = await QRCode.toDataURL(cleanText || "FEA WEATHER");
      setQrCodeUrl(url);
    } catch (err) {
      console.error("QR generation failed:", err);
      toast.error(t("SettingsPage.generationError"));
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = "qr-code.png";
    link.click();
  };

  if (isMobileOrTablet) {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex flex-col gap-4 bg-white w-full h-full rounded-lg">
          <TextEditorField content={text} setContent={setText} />
        </div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="default"
              className="bg-blue3 text-white hover:bg-blue3/90 w-full mt-4"
              onClick={() => {
                generateQRCode();
                setDrawerOpen(true);
              }}
            >
              <QrCode className="ml-2 h-4 w-4" />
              {t("SettingsPage.generateQR")}
            </Button>
          </DrawerTrigger>

          <DrawerContent className="h-full">
            <DrawerHeader className="flex items-end px-4 pt-4">
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </DrawerHeader>

            <div className="flex flex-col gap-4 px-4 overflow-auto h-full">
              <div className="w-full flex justify-center items-center">
                <div className="w-48 h-48 border rounded-lg p-2 bg-white flex items-center justify-center">
                  {qrCodeUrl ? (
                    <Image
                      width={200}
                      height={200}
                      src={qrCodeUrl}
                      alt={t("SettingsPage.generatedQRCode")}
                      className="w-40 h-40"
                    />
                  ) : (
                    <span>{t("SettingsPage.noQRGenerated")}</span>
                  )}
                </div>
              </div>

              {qrCodeUrl && (
                <Button
                  variant="default"
                  onClick={downloadQRCode}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("SettingsPage.downloadQR")}
                </Button>
              )}

              <div className="flex justify-center items-center gap-2 mt-5 w-full">
                <div className="w-full flex flex-row justify-center items-center gap-2">
                  <div className="w-full">
                    <Button
                      variant="default"
                      className="bg-red-500 text-white hover:bg-red-500 w-full"
                      onClick={() => setQrCodeUrl(null)}
                    >
                      {t("SettingsPage.delete")}
                    </Button>
                  </div>
                  <div className="w-full">
                    <Button
                      variant="default"
                      className="bg-blue3 text-white hover:bg-blue3 w-full"
                      onClick={generateQRCode}
                    >
                      {t("SettingsPage.regenerateQR")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-4 h-full">
      <div className="flex flex-col gap-4 bg-white w-full h-full rounded-lg">
        <TextEditorField content={text} setContent={setText} />
      </div>

      <div className="flex flex-col items-end justify-self-end space-y-4">
        <div className="w-48 h-48 border rounded-lg p-2 bg-white items-center justify-center flex">
          {qrCodeUrl ? (
            <Image
              width={200}
              height={200}
              src={qrCodeUrl}
              alt={t("SettingsPage.generatedQRCode")}
              className="w-40 h-40"
            />
          ) : (
            <span>{t("SettingsPage.noQRGenerated")}</span>
          )}
        </div>

        <div className="flex flex-col gap-2 justify-center w-full">
          {qrCodeUrl && (
            <Button
              variant="default"
              onClick={downloadQRCode}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Download className="mr-2 h-4 w-4" />
              {t("SettingsPage.downloadQR")}
            </Button>
          )}
          <Button
            variant="default"
            className="bg-blue1 text-white hover:bg-blue1"
            onClick={generateQRCode}
          >
            {t("SettingsPage.generateQR")}
          </Button>
          <Button
            variant="default"
            className="bg-transparent border border-red-500 text-red-500 hover:bg-transparent"
            onClick={() => setQrCodeUrl(null)}
          >
            {t("SettingsPage.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}
