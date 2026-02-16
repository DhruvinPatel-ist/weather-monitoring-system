"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import PaginationControls from "@/hooks/shared/PaginationControls";
import { DateRangePicker } from "../PopoverDatePicker";
import { ChevronDown, X, ArrowUp, ArrowDown } from "lucide-react";
import { userActivityService } from "@/services/userService";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import { useTranslations } from "next-intl";
//import { useLocale } from "next-intl";

interface UserActivityProps {
  page: number;
  perPage: number;
  onPageChange?: (newPage: number) => void;
  setTotalItems?: (n: number) => void;
}

interface UserLog {
  username: string;
  email: string | null;
  datetime: string;
  ip: string;
  activity: string;
}

export default function UserActivity({
  page,
  perPage,
  onPageChange,
  setTotalItems,
}: UserActivityProps) {
  const t = useTranslations("UserActivityLog");
    ///const locale = useLocale();
    //const isRTL = locale === "ar";
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<UserLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<UserLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateTimeSortDirection, setDateTimeSortDirection] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setIsLoading(true);
        const data = await userActivityService.getUserActivity();
        const transformedData: UserLog[] = data.map((item: any) => {
          // Format the datetime string
          let formattedDate = "-";
          if (item.dateTime) {
            const date = new Date(item.dateTime);
            formattedDate = date
              .toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })
              .replace(",", "");
          }

          return {
            username: item.username || "-",
            email: item.email ?? "-",
            ip: item.ipaddress ?? "-",
            datetime: formattedDate,
            activity: item.activity || "-",
          };
        });
        setActivityLogs(transformedData);
        setFilteredLogs(transformedData); // Initialize filtered logs with all logs
      } catch (err) {
        console.error("Error fetching activity logs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivityLogs();
  }, []);

  const uniqueUsers = Array.from(
    new Set(activityLogs.map((log) => log.username))
  );
  const handleExport = () => {
    const exportData = filteredLogs.map((log) => ({
      Username: log.username,
      Email: log.email,
      "Date & Time": log.datetime,
      "IP Address": log.ip,
      Activity: log.activity,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "UserActivity");

    XLSX.writeFile(workbook, "userActivity.xlsx");
  };
  useEffect(() => {
    setTotalItems?.(filteredLogs.length);
  }, [filteredLogs, setTotalItems]);

  // Sort filtered logs by datetime
  const sortedLogs = useMemo(() => {
    const copy = [...filteredLogs];
    copy.sort((a, b) => {
      // Parse datetime string (format: "DD/MM/YYYY HH:MM:SS")
      const parseDateTime = (dt: string): number => {
        const [datePart, timePart] = dt.split(" ");
        if (!datePart || !timePart) return 0;
        const [day, month, year] = datePart.split("/");
        const [hour, minute, second] = timePart.split(":");
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        ).getTime();
      };
      const aTime = parseDateTime(a.datetime);
      const bTime = parseDateTime(b.datetime);
      return dateTimeSortDirection === "desc" ? bTime - aTime : aTime - bTime;
    });
    return copy;
  }, [filteredLogs, dateTimeSortDirection]);

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const currentPageData = sortedLogs.slice(start, end);

  const toggleDateTimeSort = () => {
    setDateTimeSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };
  const handleDateRangeChange = (start: Date, end: Date) => {
    if (!start || !end) return; // Don't apply filter if dates are not selected

    setDateRange({ start, end });
    let filtered = [...activityLogs];

    // Apply date filter only when both dates are selected
    filtered = filtered.filter((log) => {
      const logDate = new Date(
        log.datetime.split(" ")[0].split("/").reverse().join("-")
      );
      return logDate >= start && logDate <= end;
    });

    // Keep the user filter if it's active
    if (selectedUser) {
      filtered = filtered.filter((log) => log.username === selectedUser);
    }
    setFilteredLogs(filtered);
  };

  const clearDateFilter = () => {
    setDateRange({ start: null, end: null });
    const filtered = selectedUser
      ? activityLogs.filter((log) => log.username === selectedUser)
      : activityLogs;
    setFilteredLogs(filtered);
  };

  const handleUserSelect = (username: string) => {
    setSelectedUser(username);
    setIsDropdownOpen(false);
    let filtered = [...activityLogs];
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(
          log.datetime.split(" ")[0].split("/").reverse().join("-")
        );
        return logDate >= dateRange.start! && logDate <= dateRange.end!;
      });
    }
    filtered = filtered.filter((log) => log.username === username);
    setFilteredLogs(filtered);
  };
  const handleClearFilter = () => {
    setSelectedUser(null);
    setIsDropdownOpen(false);

    // Only apply date filter if it exists
    if (dateRange.start && dateRange.end) {
      const filtered = activityLogs.filter((log) => {
        const logDate = new Date(
          log.datetime.split(" ")[0].split("/").reverse().join("-")
        );
        return logDate >= dateRange.start! && logDate <= dateRange.end!;
      });
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(activityLogs);
    }
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mt-4 mb-4">
        <h1 className="text-lg font-semibold text-[#252c32]">
          {t("title")}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <DateRangePicker
              onDateRangeChange={handleDateRangeChange}
              startDate={
                dateRange.start ||
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
              endDate={dateRange.end || new Date()}
            />
            {dateRange.start && dateRange.end && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={clearDateFilter}
              >
                <X size={16} className="mr-1" />
                {t("Clear")}
              </Button>
            )}
          </div>
          <Button
            variant="default"
            className="gap-2 bg-[#009fac] hover:bg-[#008a96]"
            onClick={handleExport}
          >
           {t("ExportLogs")}
          </Button>
        </div>
      </div>
      {selectedUser && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Filtered by:</span>
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue1 rounded-full text-sm">
            <span className="text-white">{selectedUser}</span>
            <button
              onClick={handleClearFilter}
              className="ml-1 rounded-full p-0.5 text-white hover:bg-white/20"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <div className="border rounded-md overflow-hidden">
        <div className="w-full overflow-x-auto max-h-[calc(100vh-370px)] min-h-[280px]">
          <table className="min-w-[900px] w-full text-sm text-left rtl:text-right">
            <thead className="sticky top-0 bg-white shadow-sm text-gray-700 text-xs md:text-sm font-semibold">
              <tr className="border-b border-gray-200">
                <th className="px-3 md:px-4 py-3">
                  <Checkbox />
                </th>
                <th className="px-3 md:px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>{t("UserName")}</span>
                    <div className="relative dropdown-container">
                      <button
                        onClick={handleDropdownToggle}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                          <div className="py-1 max-h-60 overflow-y-auto">
                            <button
                              onClick={handleClearFilter}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-500"
                            >
                               {t("AllUsers")}
                            </button>
                            {uniqueUsers.map((username) => (
                              <button
                                key={username}
                                onClick={() => handleUserSelect(username)}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                                  selectedUser === username
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "text-gray-700"
                                }`}
                              >
                                {username}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                <th className="px-3 md:px-4 py-3 text-center">{t("Email")}</th>
                <th 
                  className="px-3 md:px-4 py-3 text-center cursor-pointer hover:bg-gray-100 select-none"
                  onClick={toggleDateTimeSort}
                >
                  <div className="flex items-center justify-center gap-2">
                    {t("DateTime")}
                    <div className="flex flex-col">
                      <ArrowUp 
                        className={`h-3 w-3 ${
                          dateTimeSortDirection === "asc" 
                            ? "text-blue3 opacity-100" 
                            : "text-gray-400 opacity-30"
                        }`} 
                      />
                      <ArrowDown 
                        className={`h-3 w-3 -mt-1 ${
                          dateTimeSortDirection === "desc" 
                            ? "text-blue3 opacity-100" 
                            : "text-gray-400 opacity-30"
                        }`} 
                      />
                    </div>
                  </div>
                </th>
                <th className="px-3 md:px-4 py-3 text-center">{t("IPAddress")}</th>
                <th className="px-3 md:px-4 py-3 text-center">{t("Activity")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: perPage }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-3 md:px-4 py-3">
                        <Skeleton style={{ width: 20 }} />
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <Skeleton style={{ width: 100 }} />
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <Skeleton style={{ width: 120 }} />
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <Skeleton style={{ width: 150 }} />
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <Skeleton style={{ width: 140 }} />
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        <Skeleton style={{ width: 160 }} />
                      </td>
                    </tr>
                  ))
                : currentPageData.map((log, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-3 md:px-4 py-3">
                        <Checkbox />
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center font-medium">
                        {log.username}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        {log.email}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        {log.datetime}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        {log.ip}
                      </td>
                      <td className="px-3 md:px-4 py-3 text-center">
                        {log.activity}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>{" "}
      {!isLoading && filteredLogs.length > 0 && (
        <PaginationControls
          currentPage={page}
          totalItems={filteredLogs.length}
          itemsPerPage={perPage}
          onPageChange={onPageChange ?? (() => {})}
        />
      )}
    </div>
  );
}
