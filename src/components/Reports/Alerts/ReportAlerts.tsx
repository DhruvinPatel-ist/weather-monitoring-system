"use client";

import { useRef, useMemo } from "react";
import { useAlertsByInterval, useDeleteAlert } from "@/hooks/useAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Alertprop {
  startDate: any;
  endDate: any;
  selectedSiteIds: string[];
  selectedTimeframe: any;
}

interface AlertItem {
  ID: string;
  SiteID: string;
  ParameterID: string;
  threshold_value: number;
  priority: string;
  CreatedAt: string;
  threshold_name: string;
  interval: number;
  AlertID: number;
  attributeName: string;
  siteName: string;
}

export default function ReportAlerts({
  startDate,
  endDate,
  selectedSiteIds,
  selectedTimeframe,
}: Alertprop) {
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Reports");
  const c = useTranslations("Common");
  console.log("selectedSiteIds", selectedSiteIds);

  function formatDateStart(date: Date): string {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T00:00:00`;
  }

  function formatDateEnd(date: Date): string {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T23:59:59`;
  }

  interface FormatUTCDateTime {
    (isoString: string): string;
  }

  const formatUTCDateTime: FormatUTCDateTime = (isoString) => {
    const date = new Date(isoString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formattedStart = formatDateStart(startDate);
  const formattedEnd = formatDateEnd(endDate);
  const timeframeValue = selectedTimeframe?.value;

  // Create a single query key that combines all sites
  const combinedQueryKey = useMemo(
    () =>
      `${selectedSiteIds.join(
        ","
      )}/${formattedStart}/${formattedEnd}/${timeframeValue}`,
    [selectedSiteIds, formattedStart, formattedEnd, timeframeValue]
  );

  // Use a single hook call with the combined key
  // Note: You'll need to modify your useAlertsByInterval hook to handle multiple site IDs
  const {
    data: allData = [],
    isLoading,
    refetch,
  } = useAlertsByInterval(combinedQueryKey);

  // If your hook doesn't support multiple sites, you can create a custom hook
  // that handles the multiple queries internally

  const { mutate: deleteAlert } = useDeleteAlert();

  const handleDelete = (id: string) => {
    toast.promise(
      new Promise<void>((resolve, reject) => {
        deleteAlert(id, {
          onSuccess: () => {
            refetch();
            resolve();
          },
          onError: () => reject(),
        });
      }),
      {
        loading: t("deletingAlert"),
        success: t("alertDeletedSuccess"),
        error: t("failedToDeleteAlert"),
      }
    );
  };

  const getColorDot = (priority: string) => {
    const baseDot = "inline-block w-3 h-3 rounded-full";
    const priorityLower = priority.toLowerCase();

    if (priorityLower.includes("high")) {
      return <span className={`${baseDot} bg-red-600`} />;
    } else if (priorityLower.includes("medium")) {
      return <span className={`${baseDot} bg-orange-400`} />;
    } else if (priorityLower.includes("low")) {
      return <span className={`${baseDot} bg-yellow-400`} />;
    } else {
      return <span className={`${baseDot} bg-gray-400`} />;
    }
  };

  const columnWidths: Record<string, string> = {
    threshold_name: "w-[180px]",
    siteName: "w-[180px]",
    attributeName: "w-[160px]",
    threshold_value: "w-[100px]",
    interval: "w-[100px]",
    priority: "w-[80px]",
    CreatedAt: "w-[180px]",
    actions: "w-[80px]",
  };

  return (
    <div className="h-full flex flex-col rounded-md bg-white shadow-sm border border-gray-200">
      {isLoading ? (
        <Skeleton className="w-full h-40" />
      ) : (
        <div className="overflow-auto max-h-[calc(100vh-150px)] px-2">
          {/* Header */}
          <div ref={headerRef} className="overflow-y-hidden overflow-x-auto">
            <div className="min-w-[1060px]">
              <table className="table-fixed w-full border-separate border-spacing-0">
                <thead className="sticky top-0 bg-gray-100 text-sm z-10">
                  <tr className="h-10">
                    <th
                      className={`${columnWidths.threshold_name} px-4 text-center font-semibold text-gray-700`}
                    >
                      {c("Title")}
                    </th>
                    <th className={`${columnWidths.siteName} px-4 text-center`}>
                      {t("Select Site")}
                    </th>
                    <th
                      className={`${columnWidths.attributeName} px-4 text-center`}
                    >
                      {t("Parameter")}
                    </th>
                    <th
                      className={`${columnWidths.threshold_value} px-4 text-center`}
                    >
                      {c("Value")}
                    </th>
                    <th className={`${columnWidths.interval} px-4 text-center`}>
                      {c("Range")}
                    </th>
                    <th className={`${columnWidths.priority} px-4 text-center`}>
                      {c("Color")}
                    </th>
                    <th
                      className={`${columnWidths.CreatedAt} px-4 text-center`}
                    >
                      {c("Created at")}
                    </th>
                    <th className={`${columnWidths.actions} px-4 text-center`}>
                      {t("Actions")}
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>

          {/* Body */}
          <div
            ref={bodyRef}
            className="overflow-auto max-h-[calc(100vh-240px)]"
          >
            <div className="min-w-[1060px]">
              <table className="table-fixed w-full border-separate border-spacing-0">
                <tbody className="text-sm">
                  {allData && allData.length > 0 ? (
                    allData.map((alert: AlertItem) => (
                      <tr key={alert.ID} className="even:bg-gray-50 border-b">
                        <td
                          className={`${columnWidths.threshold_name} px-4 py-3 text-center text-gray-800 font-medium`}
                        >
                          {alert.threshold_name}
                        </td>
                        <td
                          className={`${columnWidths.siteName} px-4 py-3 text-gray-700 text-center`}
                        >
                          {alert.siteName}
                        </td>
                        <td
                          className={`${columnWidths.attributeName} px-4 py-3 text-gray-700 text-center`}
                        >
                          {alert.attributeName}
                        </td>
                        <td
                          className={`${columnWidths.threshold_value} px-4 py-3 text-gray-700 text-center`}
                        >
                          {alert.threshold_value.toFixed(2)}
                        </td>
                        <td
                          className={`${columnWidths.interval} px-4 py-3 text-gray-700 text-center`}
                        >
                          {alert.interval}
                        </td>
                        <td
                          className={`${columnWidths.priority} px-4 py-3 text-center`}
                        >
                          {getColorDot(alert.priority)}
                        </td>
                        <td
                          className={`${columnWidths.CreatedAt} px-4 py-3 text-gray-700 text-center`}
                        >
                          {formatUTCDateTime(alert.CreatedAt)}
                        </td>
                        <td
                          className={`${columnWidths.actions} px-4 py-3 text-center`}
                        >
                          <button
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(alert.ID)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-6 text-gray-500"
                      >
                        {t("No Data Available")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
