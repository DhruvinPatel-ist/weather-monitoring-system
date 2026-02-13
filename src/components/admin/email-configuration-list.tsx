"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import {
  ConfirmDeleteModal,
  SuccessDialog,
} from "@/components/admin/models/ConfirmDeleteModal";
import PaginationControls from "@/hooks/shared/PaginationControls";
import {
  EmailConfigurationForm,
  EmailConfigSubmitPayload,
} from "@/components/admin/form/email-config-form";
import { EmailConfigService } from "@/services/EmailConfigService";
import Image from "next/image";


interface ApiEmailConfig {
  id: number; // record id
  configurationLevel: string; // ← holds stationId (as string) from backend
  email: string; // comma-separated
  status: number;
}

type EmailConfigRow = {
  id: number; // record id
  stationName: string; // keeping UI label the same
  stationId: string; // actual station id (string)
  emailIds: string[];
  status: number;
  _raw: ApiEmailConfig;
};

interface EmailConfigurationProps {
  page: number;
  perPage: number;
  onPageChange?: (newPage: number) => void;
  setTotalItems?: (n: number) => void;
}

export default function EmailConfiguration({
  page,
  perPage,
  onPageChange,
  setTotalItems,
}: EmailConfigurationProps) {
  const t = useTranslations("EmailConfiguration");
  const qc = useQueryClient();

  /* ---------- Data ---------- */
  interface ApiResponse {
    data: ApiEmailConfig[];
    count: number;
  }

  const { data: response, isLoading } = useQuery<ApiResponse>({
    queryKey: ["emailConfigs"],
    queryFn: async () => {
      const data = await EmailConfigService.getEmailConfigs();
      return { data, count: data.length };
    },
    staleTime: 5 * 60 * 1000,
  });

  /* ---------- Map API -> Table Rows ---------- */
  const rows: EmailConfigRow[] = useMemo(() => {
    return (response?.data || []).map((r) => {
      return {
        id: r.id, // record id (for edit/delete)
        // Keep the same column label; if you later want the *name*,
        // cross-reference stations by id and swap this.
        stationName: r.configurationLevel,
        // IMPORTANT: stationId comes from configurationLevel
        stationId: String(r.configurationLevel),
        emailIds: r.email
          ? r.email
              .split(",")
              .map((e) => e.trim())
              .filter(Boolean)
          : [],
        status: r.status,
        _raw: r,
      };
    });
  }, [response]);

  /* ---------- Local UI state ---------- */
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [initialData, setInitialData] =
    useState<Partial<EmailConfigSubmitPayload> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    setTotalItems?.(rows.length);
  }, [rows.length, setTotalItems]);

  /* ---------- Mutations (now use EmailConfigSubmitPayload) ---------- */
  const createMutation = useMutation({
    mutationFn: (data: EmailConfigSubmitPayload) =>
      EmailConfigService.createEmailConfig({
        stationId: data.stationId,
        emailIds: data.emailIds || [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emailConfigs"] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EmailConfigSubmitPayload) => {
      if (!editingId) throw new Error("Missing id for update");
      return EmailConfigService.updateEmailConfig(String(editingId), {
        stationId: Number(data.stationId),
        emailIds: data.emailIds || [],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emailConfigs"] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      EmailConfigService.deleteEmailConfig(String(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emailConfigs"] });
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setIsSuccessModalOpen(true);
    },
  });

  /* ---------- Handlers ---------- */
  const handleOpenCreate = () => {
    setMode("create");
    setInitialData(null);
    setEditingId(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (row: EmailConfigRow) => {
    setMode("edit");
    setEditingId(String(row.id)); // record id
    // Pass stationId (number) + emailIds[] to the form
    setInitialData({
      stationId: Number(row.stationId),
      emailIds: row.emailIds,
    });
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  const handleSelectRow = (stationId: string) => {
    setSelectedRows((prev) =>
      prev.includes(stationId)
        ? prev.filter((x) => x !== stationId)
        : [...prev, stationId]
    );
  };

  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => setIsSuccessModalOpen(false), 1600);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);

  // Pagination logic similar to site-configuration-list.tsx
  const [currentPage, setCurrentPage] = useState(page);
  useEffect(() => {
    setCurrentPage(page);
  }, [page]);
  const startIndex = (currentPage - 1) * perPage;
  const pageRows = rows.slice(startIndex, startIndex + perPage);

  return (
    <div className="p-2">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-[#101828]">{t("title")}</h1>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue3 hover:bg-blue3/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("newConfiguration")}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <div className="w-full overflow-x-auto max-h-[calc(100vh-360px)] min-h-[320px]">
          <table className="min-w-[1000px] w-full text-sm rtl:text-right ltr:text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white shadow-sm text-gray-700 text-xs md:text-sm font-semibold">
              <tr className="border-b border-gray-200">
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={
                      pageRows.length > 0 &&
                      selectedRows.length === pageRows.length
                    }
                    onCheckedChange={() => {
                      if (selectedRows.length === pageRows.length) {
                        setSelectedRows([]);
                      } else {
                        setSelectedRows(pageRows.map((r) => r.stationId));
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3">{t("site")}</th>
                <th className="px-4 py-3">{t("emails")}</th>
                <th className="px-4 py-3 text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b">
                    {Array(7)
                      .fill(null)
                      .map((_, idx) => (
                        <td key={idx} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                        </td>
                      ))}
                  </tr>
                ))
              ) : pageRows.length > 0 ? (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedRows.includes(row.stationId)}
                        onCheckedChange={() => handleSelectRow(row.stationId)}
                      />
                    </td>
                    <td className="px-4 py-3">{row.stationName}</td>
                    <td className="px-4 py-3">
                      {row.emailIds.length ? (
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[240px]">
                            {row.emailIds[0]}
                          </span>
                          {row.emailIds.length > 1 && (
                            <Badge>+{row.emailIds.length - 1}</Badge>
                          )}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => handleOpenEdit(row)}
                          variant="ghost"
                          className="hover:bg-transparent"
                          title={t("edit")}
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
                          title={t("delete")}
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
              ) : (
                <tr className="border-b">
                  <td
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                    colSpan={4}
                  >
                    {t("noRows")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div
            className="
              bg-white rounded-lg shadow-2xl
              w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl
              max-h-[95vh] overflow-y-auto
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {mode === "create" ? t("createTitle") : t("editTitle")}
              </h2>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={handleClose}
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 sm:px-6 py-4 sm:py-6">
              <EmailConfigurationForm
                mode={mode}
                initialData={initialData || undefined}
                onSubmit={(payload) => {
                  // payload is already { stationId: number, emailIds: string[] }
                  if (mode === "create") createMutation.mutate(payload);
                  else updateMutation.mutate(payload);
                }}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete + Toast */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        onCancel={() => setIsDeleteModalOpen(false)}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
      />
      <SuccessDialog
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={t("deletedTitle")}
        message={t("deletedMessage")}
      />

      {rows.length > 0 && (
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
