"use client";

import { useGetNotifications } from "@/hooks/useNotification";
import NoNotification from "@/components/notification/NoNotification";
import { groupNotificationsByTime } from "@/utils/groupNotificationsByTime";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import { useTranslations } from "next-intl";

dayjs.extend(relativeTime);

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useGetNotifications();
  const t = useTranslations("Notifications");

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2 border-b pb-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/4 ml-auto" />
        </div>
      ))}
    </div>
  );

  function formatUTCString(dateString: string): string {
    const [datePart, timePartWithMsZ] = dateString.split("T");
    const [yyyy, mm, dd] = datePart.split("-");
    const [HH, MM, SSWithMs] = timePartWithMsZ.replace("Z", "").split(":");
    const SS = SSWithMs?.split(".")[0] ?? "00";
    return `${HH}:${MM}:${SS} - ${dd}-${mm}-${yyyy}`;
  }

  // Use the translation-aware grouping function
  const grouped = groupNotificationsByTime(notifications, t);

  const isJustNow = (timestamp: string) => {
    return dayjs().diff(dayjs(timestamp), "minute") <= 1;
  };

  return (
    <div className="bg-transparent h-full w-full p-2 ">
      <div className="h-full flex flex-col bg-white rounded-md p-3 shadow-sm  mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
            {t("notifications")} {!isLoading && `(${notifications.length})`}
          </h1>
          <button className="text-blue-600 hover:underline text-sm font-medium">
            {/* {t("markAllAsRead")} */}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto max-h-[90vh] pr-1 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-500 scrollbar-track-transparent">
          {isLoading ? (
            renderSkeleton()
          ) : notifications.length === 0 ? (
            <NoNotification />
          ) : (
            Object.entries(grouped).map(([label, group]) =>
              group.length > 0 ? (
                <div key={label} className="mb-6">
                  <h2 className="text-sm sm:text-md font-semibold text-gray-700 mb-2">
                    {label}
                  </h2>
                  <div className="space-y-3">
                    {[...group]
                      .sort(
                        (a, b) =>
                          dayjs(b.created_at).valueOf() -
                          dayjs(a.created_at).valueOf()
                      )
                      .map((n) => {
                        const justNow = isJustNow(n.created_at);
                        return (
                          <div
                            key={n.id}
                            className="border-b pb-2 text-sm text-gray-800 flex items-start justify-between gap-2 mx-2"
                          >
                            <p className="flex-1 pr-2">{n.message}</p>
                            <div className="text-right text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap min-w-[90px]">
                              {justNow ? (
                                <>
                                  <span className="text-green-500 text-[10px]">
                                    🟢
                                  </span>
                                  <span className="text-green-600 font-semibold">
                                    {t("justNow")}
                                  </span>
                                </>
                              ) : (
                                <span>{formatUTCString(n.created_at)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : null
            )
          )}
        </div>
      </div>
    </div>
  );
}
