/* eslint-disable */
"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useLoggerExportReportMutation } from "@/hooks/useExport";
import { useReportPayloadStore } from "@/stores/reportPayload";

type ReportFormat = {
  id: "pdf" | "docx" | "xlsx" | "csv";
  name: string;
  icon: "pdf" | "docx" | "excel" | "csv";
};

export default function DownloadReportComponent({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("");
  const isMobileOrTablet = useDeviceDetection();
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] =
    useState<ReportFormat["id"]>("pdf");
  const [isExpanded, setIsExpanded] = useState(true);

  const { payload } = useReportPayloadStore(); // read final payload
  const { mutate: downloadReport } = useLoggerExportReportMutation();

  const formats: ReportFormat[] = useMemo(
    () => [
      { id: "pdf", name: t("Admin.PDF"), icon: "pdf" },
      { id: "docx", name: t("Admin.DocxFormat"), icon: "docx" },
      { id: "xlsx", name: t("Admin.Excel"), icon: "excel" },
      { id: "csv", name: t("Admin.CSV"), icon: "csv" },
    ],
    [t]
  );

  // Only requirement for enabling Export button: payload exists
  const hasPayload = !!payload;

  // For download safety, still validate all fields (quietly)
  const canDownload =
    !!payload &&
    Array.isArray(payload.siteId) &&
    payload.siteId.length > 0 &&
    Array.isArray(payload.selectedAttributes) &&
    payload.selectedAttributes.length > 0 &&
    !!payload.fromDateStr &&
    !!payload.toDateStr;

  const handleDownload = () => {
    if (!payload) return;

    // Maintain original fields + add "format"
    // Also include "mode" mirrored from interval (backend compatibility)
    const body = {
      ...payload,
      format: selectedFormat,
    };

    // Helper to format date
    function formatDate(dateStr: string): string {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    // Helper to get month name
    function getMonthName(dateStr: string): string {
      const d = new Date(dateStr);
      return d.toLocaleString('default', { month: 'long' });
    }

    // Calculate period type
    const fromDate = new Date(payload.fromDateStr);
    const toDate = new Date(payload.toDateStr);
    const diffDays = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let periodLabel = "";
    if (diffDays === 1) {
      periodLabel = `day_${formatDate(payload.fromDateStr)}`;
    } else if (
      fromDate.getFullYear() === toDate.getFullYear() &&
      fromDate.getMonth() === toDate.getMonth() &&
      fromDate.getDate() === 1 &&
      toDate.getDate() === new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0).getDate()
    ) {
      // Full month
      periodLabel = `month_${getMonthName(payload.fromDateStr)}_${fromDate.getFullYear()}`;
    } else if (
      fromDate.getFullYear() === toDate.getFullYear() &&
      fromDate.getMonth() === 0 &&
      fromDate.getDate() === 1 &&
      toDate.getMonth() === 11 &&
      toDate.getDate() === 31
    ) {
      // Full year
      periodLabel = `yearly_${fromDate.getFullYear()}`;
    } else {
      // Week or custom range
      periodLabel = `weekly_${formatDate(payload.fromDateStr)}_to_${formatDate(payload.toDateStr)}`;
    }

    // Map format to MIME type and extension
    const formatMimeMap: Record<string, { mime: string; ext: string }> = {
      pdf: { mime: "application/pdf", ext: ".pdf" },
      docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: ".docx" },
      xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: ".xlsx" },
      csv: { mime: "text/csv", ext: ".csv" },
    };

    downloadReport(body, {
      onSuccess: (response) => {
        // Use correct MIME type for Blob
        const mimeType = formatMimeMap[selectedFormat]?.mime || response.headers["content-type"] || "application/octet-stream";
        const blob = new Blob([response.data], { type: mimeType });
        const downloadUrl = window.URL.createObjectURL(blob);

        // Use correct extension for filename
        const ext = formatMimeMap[selectedFormat]?.ext || "";
        let filename = `report_${periodLabel}${ext}`;
        let contentDisposition = response.headers["content-disposition"] || response.headers["Content-Disposition"];
        if (contentDisposition) {
          // Try to extract filename from header (handle various formats)
          let filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/);
          if (!filenameMatch) {
            filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
          }
          if (filenameMatch && filenameMatch[1]) {
            let baseFilename = decodeURIComponent(filenameMatch[1]);
            // Ensure extension matches selected format
            if (!baseFilename.endsWith(ext)) {
              baseFilename = baseFilename.replace(/\.[^.]+$/, ext);
            }
            filename = baseFilename;
          }
        }

        // Fallback: if filename is still not valid, use sensible default
        if (!filename || filename.match(/^(pdf|docx|xlsx|csv)_file/i)) {
          filename = `report_${periodLabel}_${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}${ext}`;
        }

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        setOpen(false);
      },
      onError: (error) => {
        console.error("File download failed:", error);
      },
    });
  };

  return (
    <div>
      <Button
        onClick={() => setOpen(true)}
        disabled={!hasPayload}
        className={cn(
          "bg-blue3 hover:bg-[#008a99] text-white disabled:bg-gray-300 disabled:cursor-not-allowed",
          className
        )}
      >
        {t("Dashboard.Download")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "overflow-hidden max-h-[90vh] sm:max-h-[90vh] sm:max-w-md",
            isMobileOrTablet
              ? "p-0 sm:max-w-full rounded-t-lg rounded-b-none fixed bottom-0 top-auto translate-y-0 border-t border-l border-r"
              : "sm:max-w-md p-0"
          )}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>{t("Admin.Download Report")}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-4">
            {/* Format Selection ONLY */}
            <p className="text-sm text-[#5f5f5f] mb-1">
              {t("Admin.Report Format")}
            </p>
            <div
              className="flex items-center justify-between p-3 cursor-pointer border rounded-sm mb-3"
              onClick={() => setIsExpanded((s) => !s)}
            >
              <span>{formats.find((f) => f.id === selectedFormat)?.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {isExpanded && (
              <div className="max-h-[200px] overflow-auto border rounded-md mb-4">
                {formats.map((format) => (
                  <div
                    key={format.id}
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setSelectedFormat(format.id);
                      setIsExpanded(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FormatIcon type={format.icon} />
                      <span>{format.name}</span>
                    </div>
                    {selectedFormat === format.id && (
                      <Check className="h-4 w-4 text-blue3" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No payload info shown */}

            {/* Download Button */}
            <div className="flex flex-col gap-2 mt-4">
              <Button
                onClick={handleDownload}
                disabled={!canDownload}
                className="bg-[#009fac] hover:bg-[#008a99] text-white w-full py-6 text-base disabled:bg-gray-300"
              >
                {t("Admin.Download")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormatIcon({ type }: { type: "pdf" | "docx" | "excel" | "csv" }) {
  const iconMap: Record<string, string> = {
    pdf: "/downloadComp/pdf.svg",
    docx: "/downloadComp/doxs.svg",
    excel: "/downloadComp/excel.svg",
    csv: "/downloadComp/csv.svg",
  };
  const iconSrc = iconMap[type];

  return iconSrc ? (
    <div className="w-6 h-6 flex items-center justify-center rounded">
      <Image src={iconSrc} alt={`${type} icon`} width={20} height={20} />
    </div>
  ) : null;
}
