"use client";

import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
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
import { Station } from "./view/parameter-view";
import { useLoggerExportMutation } from "@/hooks/useExport";
import { useStationParameters } from "@/hooks/useParameters";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

type DownloadReportComponentProps = {
  className?: string;
  selectedStation: Station | null;
  timeframe: any;
};

type ReportFormat = {
  id: string;
  name: string;
  icon: string;
};

export default function DownloadReportComponent({
  selectedStation,
  timeframe,
  className,
}: DownloadReportComponentProps) {
  const t = useTranslations("");
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAttrExpanded, setIsAttrExpanded] = useState(false);
  const isMobileOrTablet = useDeviceDetection();
  const { mutate: downloadReport } = useLoggerExportMutation();

  const formats: ReportFormat[] = [
    { id: "pdf", name: t("Admin.PDF"), icon: "pdf" },
    { id: "docx", name: t("Admin.DocxFormat"), icon: "docx" },
    { id: "xlsx", name: t("Admin.Excel"), icon: "excel" },
    { id: "csv", name: t("Admin.CSV"), icon: "csv" },
  ];

  dayjs.extend(utc);
  dayjs.extend(timezone);

  const now = dayjs().tz("Asia/Dubai");
  let fromDateString: string;
  let toDateStrring: string;

  switch (timeframe.value) {
    case "live":
      const oneDayAgo = now.subtract(1, "day");
      fromDateString = oneDayAgo.format("YYYY-MM-DDTHH:mm:ss.000");
      toDateStrring = now.format("YYYY-MM-DDTHH:mm:ss.000");
      break;

    case "lastDay":
      const yesterday = now.subtract(1, "day").format("YYYY-MM-DD");
      fromDateString = `${yesterday}T00:00:00.000`;
      toDateStrring = `${yesterday}T23:59:00.000`;
      break;

    case "lastWeek":
      const weekAgo = now.subtract(6, "day");
      fromDateString = weekAgo.format("YYYY-MM-DDTHH:mm:ss.000");
      toDateStrring = now.format("YYYY-MM-DDTHH:mm:ss.000");
      break;

    case "lastMonth":
      const monthAgo = now.subtract(1, "month");
      fromDateString = monthAgo.format("YYYY-MM-DDTHH:mm:ss.000");
      toDateStrring = now.format("YYYY-MM-DDTHH:mm:ss.000");
      break;

    case "lastYear":
      const yearAgo = now.subtract(1, "year");
      fromDateString = yearAgo.format("YYYY-MM-DDTHH:mm:ss.000");
      toDateStrring = now.format("YYYY-MM-DDTHH:mm:ss.000");
      break;

    default:
      fromDateString = "";
      toDateStrring = "";
  }

  // Fetch parameters for selected station
  const { data: parameters = [], isLoading: isLoadingParams } =
    useStationParameters(selectedStation?.id);

  // Map parameters to attributes
  const attributeOptions = parameters.map((param) => ({
    id: param.ParameterID,
    name: param.ParameterName,
    displayName: param.ParameterName,
    unit: param.UnitName,
  }));

  // Use parameter IDs for selected attributes
  const [selectedAttributes, setSelectedAttributes] = useState<number[]>([]);

  // Don't auto-select all parameters, start with an empty selection
  useEffect(() => {
    // Initialize with empty array, letting user select parameters
    setSelectedAttributes([]);
  }, [selectedStation?.id]);

  const toggleDropdown = () => setIsExpanded(!isExpanded);
  const toggleAttrDropdown = () => setIsAttrExpanded(!isAttrExpanded);

  const toggleAttribute = (attrId: number) => {
    if (attrId === null || attrId === undefined) return; // Skip invalid IDs

    setSelectedAttributes((prev) =>
      prev.includes(attrId)
        ? prev.filter((a) => a !== attrId)
        : [...prev, attrId]
    );
  };

  const handleDownload = () => {
    // Filter out any null or undefined values from the selected attributes
    const filteredParameterIds = selectedAttributes.filter(
      (id) => id !== null && id !== undefined
    );

    const body = {
      siteId: selectedStation?.id ? [Number(selectedStation.id)] : [],
      mode: timeframe?.value || "lastDay",
      format: selectedFormat,
      selectedAttributes: filteredParameterIds, // Send as integers using parameterIds field
      fromDateStr: fromDateString,
      toDateStr: toDateStrring,
    };

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
        let filename = `report_${dayjs().format("YYYYMMDD")}${ext}`;
        const contentDisposition = response.headers["content-disposition"] || response.headers["Content-Disposition"];
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
          filename = `report_${dayjs().format("YYYYMMDD_HHmmss")}${ext}`;
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
        className={`bg-blue3 hover:bg-[#008a99] text-white ${className}`}
      >
        {t("Dashboard.Export")}
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
            {/* Format Selection */}
            <p className="text-sm text-[#5f5f5f] mb-1">
              {t("Admin.Report Format")}
            </p>
            <div
              className="flex items-center justify-between p-3 cursor-pointer border rounded-sm mb-3"
              onClick={toggleDropdown}
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

            {/* Attribute Selection */}
            <p className="text-sm text-[#5f5f5f] mb-1">
              {t("Admin.Select Attributes")}
            </p>
            <div
              className="flex items-center justify-between p-3 cursor-pointer border rounded-sm mb-3"
              onClick={toggleAttrDropdown}
            >
              <span>
                {isLoadingParams ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("Admin.Loading Parameters")}
                  </span>
                ) : selectedAttributes.length === 0 ? (
                  t("Admin.Select Parameters")
                ) : selectedAttributes.length === 1 ? (
                  `${selectedAttributes.length} ${t(
                    "Admin.Parameter Selected"
                  )}`
                ) : (
                  `${selectedAttributes.length} ${t(
                    "Admin.Parameters Selected"
                  )}`
                )}
              </span>
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
            {isAttrExpanded && (
              <div className="max-h-[200px] overflow-auto border rounded-md mb-4">
                {isLoadingParams ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : attributeOptions.length > 0 ? (
                  attributeOptions.map((attr) => (
                    <div
                      key={attr.id}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleAttribute(attr.id)}
                    >
                      <span>
                        {t(`Dashboard.${attr.name}`, {
                          fallback: attr.displayName,
                        })}{" "}
                        {attr.unit ? `(${attr.unit})` : ""}
                      </span>
                      <input
                        type="checkbox"
                        readOnly
                        checked={selectedAttributes.includes(attr.id)}
                        className="h-4 w-4 accent-blue-600"
                      />
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    {t("Admin.No Parameters Available")}
                  </div>
                )}
              </div>
            )}

            {/* Download Button */}
            <div className="flex flex-col gap-2 mt-4">
              {!selectedStation && (
                <p className="text-red-500 text-sm text-center">
                  {t("Admin.Please select a station")}
                </p>
              )}
              {selectedAttributes.length === 0 && (
                <p className="text-red-500 text-sm text-center">
                  {t("Admin.Please select at least one parameter")}
                </p>
              )}
              <Button
                onClick={handleDownload}
                disabled={
                  !selectedStation ||
                  selectedAttributes.length === 0 ||
                  isLoadingParams
                }
                className="bg-[#009fac] hover:bg-[#008a99] text-white w-full py-6 text-base disabled:bg-gray-300"
              >
                {isLoadingParams ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t("Admin.Loading")}
                  </span>
                ) : (
                  t("Admin.Download")
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormatIcon({ type }: { type: string }) {
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
