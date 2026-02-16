/* eslint-disable */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";

import {
  ConfirmDeleteModal,
  SuccessDialog,
} from "@/components/admin/models/ConfirmDeleteModal";
import PaginationControls from "@/hooks/shared/PaginationControls";

import {
  SiteConfigurationForm,
  SiteConfigSubmitPayload,
  SiteConfigFormData,
} from "@/components/admin/form/site-config-model";

import {
  SiteService,
  SiteConfigResponse,
  SiteConfig,
} from "@/services/siteService";
import Image from "next/image";

/* ---------- Types ---------- */
type Maybe<T> = T | undefined | null;

type SiteRow = {
  id: string;
  siteName: string;
  siteId: string;
  parameterDisplayText: string;
  unitDisplayText: string;
  connectionType: string;
  createdAt: Maybe<string>;
  status: "Active" | "InActive" | string;
  latitude: number;
  longitude: number;
  parameterCount: number;
  ftpStatus: string;
  ftpConfigId: string;
  file_url: string;
  ftp_port: number;
  ftp_user: string;
  _raw: any;
};

interface SiteConfigurationProps {
  page: number;
  perPage: number;
  onPageChange?: (newPage: number) => void;
  setTotalItems?: (n: number) => void;
}

export default function SiteConfiguration({
  page,
  perPage,
  onPageChange,
  setTotalItems,
}: SiteConfigurationProps) {
  const t = useTranslations("SiteConfiguration");
  const tc = useTranslations("Common");
  const qc = useQueryClient();

  // Helper function to extract error message
  const getErrorMessage = (error: any, defaultMessage: string): string => {
    if (error?.response) {
      const status = error.response.status;
      const serverMessage = error.response.data?.message;

      switch (status) {
        case 401:
          return "Authentication failed. Please login again.";
        case 403:
          return "You don't have permission to perform this action.";
        case 404:
          return "Resource not found.";
        case 409:
          return "Conflict: This operation cannot be completed due to conflicting data.";
        case 422:
          return (
            serverMessage || "Invalid data provided. Please check your input."
          );
        case 500:
          return "Server error. Please try again later.";
        default:
          return serverMessage || `${defaultMessage} (Error ${status})`;
      }
    } else if (error?.message) {
      if (
        error.message.includes("Network Error") ||
        error.message.includes("fetch")
      ) {
        return "Network error. Please check your connection and try again.";
      }
      return error.message;
    }
    return defaultMessage;
  };

  const {
    data: response,
    isLoading,
    error,
    isError,
  } = useQuery<SiteConfigResponse>({
    queryKey: ["siteConfigs"],
    queryFn: SiteService.geAlltSiteConfigs,
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Show error toast if query fails
  useEffect(() => {
    if (isError && error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to load site configurations. Please try again."
      );
      toast.error(errorMessage);
    }
  }, [isError, error]);

  const siteConfigs = response?.data || [];

  const rows: SiteRow[] = useMemo(() => {
    return (siteConfigs || [])
      .map((r: SiteConfig) => {
        console.log("r.siteStatus",r.siteStatus);
        const connectionType = "FTP";
        return {
          id: r.siteId,
          siteName: r.siteName || `Site ${r.siteId}`,
          siteId: r.siteId,
          parameterDisplayText: r.parameterDisplayText || "No parameters",
          unitDisplayText: r.unitDisplayText || "No units",
          connectionType,
          createdAt: r.siteCreatedAt || null,
          status: r.siteStatus || "InActive",
          latitude: r.latitude,
          longitude: r.longitude,
          parameterCount: r.parameterCount,
          ftpStatus: r.ftpStatus,
          ftpConfigId: r.ftpConfigId,
          file_url: r.file_url,
          ftp_port: r.ftp_port,
          ftp_user: r.ftp_user,
          _raw: r,
        };
      })
      .sort((a, b) => Number(a.siteId) - Number(b.siteId)); // <-- Add this sort
  }, [siteConfigs]);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [initialData, setInitialData] =
    useState<Partial<SiteConfigFormData> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    setTotalItems?.(rows.length);
  }, [rows.length, setTotalItems]);

  /* ---------- Mutations ---------- */
  const createMutation = useMutation({
    mutationFn: (data: SiteConfigSubmitPayload) =>
      SiteService.createSiteConfig(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["siteConfigs"] });
      handleClose();
      toast.success("Site configuration created successfully!");
    },
    onError: (error: any) => {
      console.error("Failed to create site configuration:", error);
      const errorMessage = getErrorMessage(
        error,
        "Failed to create site configuration. Please try again."
      );
      toast.error(errorMessage);
    },
  });

  // Main update mutation (for full config updates)
  const updateMutation = useMutation({
    mutationFn: (args: { siteId: string; data: SiteConfigSubmitPayload }) =>
      SiteService.updateSiteConfig(args.siteId, args.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["siteConfigs"] });
      setUpdatingStatuses({});
      handleClose();
      toast.success("Site configuration updated successfully!");
    },
    onError: (error: any) => {
      console.error("Failed to update site configuration:", error);
      setUpdatingStatuses({});
      const errorMessage = getErrorMessage(
        error,
        "Failed to update site configuration. Please try again."
      );
      toast.error(errorMessage);
    },
  });

  // Status-only update mutation
  const updateStatusMutation = useMutation({
    mutationFn: (args: {
      siteId: string;
      data: { status: "Active" | "InActive" };
    }) => SiteService.updateSiteConfig(args.siteId, args.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["siteConfigs"] });
      setUpdatingStatuses({});
      const statusText =
        variables.data.status === "Active" ? "activated" : "deactivated";
      toast.success(`Site configuration ${statusText} successfully!`);
    },
    onError: (error: any, variables) => {
      console.error("Failed to update site status:", error);
      // Revert the optimistic update
      setUpdatingStatuses((prev) => {
        const { [variables.siteId]: _, ...rest } = prev;
        return rest;
      });
      const errorMessage = getErrorMessage(
        error,
        "Failed to update site status. Please try again."
      );
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => SiteService.deleteSiteConfig(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["siteConfigs"] });
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setIsSuccessModalOpen(true);
      toast.success("Site configuration deleted successfully!");
    },
    onError: (error: any) => {
      console.error("Failed to delete site configuration:", error);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      const errorMessage = getErrorMessage(
        error,
        "Failed to delete site configuration. Please try again."
      );
      toast.error(errorMessage);
    },
  });

  const handleOpenCreate = () => {
    setMode("create");
    // Only seed minimal fields; form will handle the rest
    setInitialData({
      station_id: "",
      station_name: "",
      parameters: [],
      connection_type: "FTP",
      status: "Active",
    });
    setEditingId(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (row: SiteRow) => {
    // IMPORTANT: pass ONLY the station_id; the form will fetch everything
    setMode("edit");
    setEditingId(row.siteId);
    setInitialData({
      station_id: row.siteId,
    });
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const [updatingStatuses, setUpdatingStatuses] = useState<
    Record<string, string>
  >({});

  const handleStatusToggle = (row: SiteRow, checked: boolean) => {
    const newStatus = checked ? "Active" : "InActive";

    // Prevent multiple simultaneous updates
    if (updateStatusMutation.isPending) {
      toast.warning("Please wait for the current status update to complete.");
      return;
    }

    // UI optimistic update
    setUpdatingStatuses((prev) => ({
      ...prev,
      [row.id]: newStatus,
    }));

    // Send only the status field in the payload
    updateStatusMutation.mutate({
      siteId: row.siteId,
      data: { status: newStatus },
    });
  };

  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => setIsSuccessModalOpen(false), 1600);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);

  // Pagination logic similar to usertable.tsx
  const [currentPage, setCurrentPage] = useState(page);

  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  const startIndex = (currentPage - 1) * perPage;
  const [createdSortDirection, setCreatedSortDirection] = useState<
    "asc" | "desc"
  >("desc");
  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return createdSortDirection === "desc" ? bTime - aTime : aTime - bTime;
    });
    return copy;
  }, [rows, createdSortDirection]);
  const paginatedRows = sortedRows.slice(startIndex, startIndex + perPage);
  const toggleCreatedSort = () => {
    setCreatedSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-[#101828]">
          {t("title") || "Site Configuration"}
        </h1>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue3 hover:bg-blue3/90 text-white"
          disabled={createMutation.isPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          {createMutation.isPending
            ? "Creating..."
            : t("newConfiguration") || "New Configuration"}
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <div className="w-full overflow-x-auto max-h-[calc(100vh-360px)] min-h-[320px]">
          <table className="min-w-[1000px] w-full text-sm rtl:text-right ltr:text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white shadow-sm text-gray-700 text-xs md:text-sm font-semibold">
              <tr className="border-b border-gray-200">
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={
                      selectedRows.length === paginatedRows.length &&
                      paginatedRows.length > 0
                    }
                    onCheckedChange={() => {
                      if (selectedRows.length === paginatedRows.length) {
                        setSelectedRows([]);
                      } else {
                        setSelectedRows(paginatedRows.map((r) => r.id));
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3">{t("siteName") || "Site Name"}</th>
                <th className="px-4 py-3">{t("siteId") || "Site ID"}</th>
                <th className="px-4 py-3">{t("parameters") || "Parameters"}</th>
                <th className="px-4 py-3">{t("units") || "Units"}</th>
                <th className="px-4 py-3">
                  {t("connectionType") || "Connection Type"}
                </th>
                <th
                  className="px-4 py-3 cursor-pointer select-none"
                  onClick={toggleCreatedSort}
                >
                  <div className="flex items-center gap-1">
                    <span>{t("createdDate") || "Created Date"}</span>
                    <span className="flex flex-col">
                      <ArrowUp
                        className={`h-3 w-3 -mb-0.5 ${
                          createdSortDirection === "asc"
                            ? "text-blue3 opacity-100"
                            : "text-gray-400 opacity-40"
                        }`}
                      />
                      <ArrowDown
                        className={`h-3 w-3 -mt-0.5 ${
                          createdSortDirection === "desc"
                            ? "text-blue3 opacity-100"
                            : "text-gray-400 opacity-40"
                        }`}
                      />
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3">{t("statusType") || "Status"}</th>
                <th className="px-4 py-3 text-center">
                  {t("actions") || "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b">
                    {Array(9)
                      .fill(null)
                      .map((_, idx) => (
                        <td key={idx} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                        </td>
                      ))}
                  </tr>
                ))
              ) : isError ? (
                <tr className="border-b">
                  <td
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                    colSpan={9}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-red-600">
                        Failed to load site configurations.
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          qc.refetchQueries({ queryKey: ["siteConfigs"] })
                        }
                        className="text-blue-600"
                      >
                        Try Again
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr className="border-b">
                  <td
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                    colSpan={9}
                  >
                    {t("noRows") || "No site configurations found."}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedRows.includes(row.id)}
                        onCheckedChange={() => handleSelectRow(row.id)}
                      />
                    </td>
                    <td className="px-4 py-3">{row.siteName}</td>
                    <td className="px-4 py-3">{row.siteId}</td>
                    <td className="px-4 py-3">{row.parameterDisplayText}</td>
                    <td className="px-4 py-3">{row.unitDisplayText}</td>
                    <td className="px-4 py-3">{row.connectionType}</td>
                    <td className="px-4 py-3">
                      {row.createdAt
                        ? format(new Date(row.createdAt), "d MMM yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={
                            (updatingStatuses[row.id] || row.status) ===
                            "Active"
                          }
                          onCheckedChange={(checked) =>
                            handleStatusToggle(row, checked)
                          }
                          disabled={updateStatusMutation.isPending}
                          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200"
                        />
                        <span
                          className={
                            (updatingStatuses[row.id] || row.status) ===
                            "Active"
                              ? "text-green-600 text-[13px]"
                              : "text-gray-500 text-[13px]"
                          }
                        >
                          {updatingStatuses[row.id] || row.status}
                          {updateStatusMutation.isPending &&
                            updatingStatuses[row.id] && (
                              <span className="ml-1 text-xs text-blue-500">
                                ...
                              </span>
                            )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => handleOpenEdit(row)}
                          variant="ghost"
                          className="hover:bg-transparent"
                          title="Edit"
                          disabled={
                            updateMutation.isPending || deleteMutation.isPending
                          }
                        >
                          <Image
                            src="/Setting/edit.svg"
                            alt="edit"
                            width={15}
                            height={15}
                          />
                        </Button>
                        <Button
                          onClick={() => {
                            setDeleteId(row.id);
                            setIsDeleteModalOpen(true);
                          }}
                          variant="ghost"
                          className="hover:bg-transparent"
                          title="Delete"
                          disabled={
                            updateMutation.isPending || deleteMutation.isPending
                          }
                        >
                          <Image
                            src="/Setting/delete.svg"
                            alt="delete"
                            width={15}
                            height={15}
                          />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl max-h-[95vh] overflow-y-auto relative">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {mode === "create"
                  ? t("createTitle") || "Create Site Configuration"
                  : t("editTitle") || "Edit Site Configuration"}
              </h2>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={handleClose}
                aria-label={tc("close")}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-4 sm:py-6">
              {(createMutation.isPending || updateMutation.isPending) && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">
                      {mode === "create" ? "Creating..." : "Updating..."}
                    </span>
                  </div>
                </div>
              )}
              <SiteConfigurationForm
                mode={mode}
                initialData={initialData}
                parameterOptions={[]}
                onSubmit={(payload) => {
                  if (mode === "create") {
                    createMutation.mutate(payload);
                  } else if (editingId) {
                    updateMutation.mutate({ siteId: editingId, data: payload });
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {t("cancel") || "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onConfirm={() => {
          if (!deleteMutation.isPending && deleteId) {
            deleteMutation.mutate(deleteId);
          }
        }}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setIsDeleteModalOpen(false);
            setDeleteId(null);
          }
        }}
        title={t("deleteTitle") || "Delete configuration?"}
        description={t("deleteDescription") || "This action cannot be undone."}
        confirmLabel={
          deleteMutation.isPending ? "Deleting..." : t("delete") || "Delete"
        }
        cancelLabel={t("cancel") || "Cancel"}
      />
      <SuccessDialog
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={t("deletedTitle") || "Deleted"}
        message={t("deletedMessage") || "The configuration has been deleted."}
      />

      {!isLoading && rows.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={rows.length}
          itemsPerPage={perPage}
          onPageChange={(newPage) => {
            if (onPageChange) onPageChange(newPage);
            setCurrentPage(newPage);
          }}
        />
      )}
    </div>
  );
}
