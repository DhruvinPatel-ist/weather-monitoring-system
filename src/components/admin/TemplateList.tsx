"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, X } from "lucide-react";

import PaginationControls from "@/hooks/shared/PaginationControls";
import {
  ConfirmDeleteModal,
  SuccessDialog,
} from "@/components/admin/models/ConfirmDeleteModal";
import {
  TemplateForm,
  TemplateFormValues,
} from "@/components/admin/form/template-form";
import { TemplateService, ApiTemplate } from "@/services/templateService";

type Maybe<T> = T | null | undefined;

type TemplateRow = {
  id: number;
  name: string; // TemplateName
  headerRows: number; // NumberOfHeaderRows
  footerRows: number; // NumberOfFooterRows
  delimiter: string; // FieldDelimiter
  status: "Active" | "Inactive" | string; // UI only (not in API)
  createdAt: Maybe<string>;
  _raw: ApiTemplate;
};

interface TemplateListProps {
  page: number;
  perPage: number;
  onPageChange?: (p: number) => void;
  setTotalItems?: (n: number) => void;
}

export default function TemplateList({
  page,
  perPage,
  onPageChange,
  setTotalItems,
}: TemplateListProps) {
  const t = useTranslations("Template");
  const tc = useTranslations("Common");
  const qc = useQueryClient();

  /* ---------- Query ---------- */
  const { data: templates = [], isLoading } = useQuery<ApiTemplate[]>({
    queryKey: ["templates"],
    queryFn: TemplateService.getTemplates,
    staleTime: 5 * 60 * 1000,
  });

  const rows: TemplateRow[] = useMemo(
    () =>
      (templates || []).map((r) => ({
        id: Number(r.ID),
        name: r.TemplateName || `Template ${r.ID}`,
        headerRows: Number(r.NumberOfHeaderRows ?? 0),
        footerRows: Number(r.NumberOfFooterRows ?? 0),
        delimiter: r.FieldDelimiter ?? "-",
        status: "Active", // API doesn't provide; keep UI consistent
        createdAt: r.CreatedAt ?? null,
        _raw: r,
      })),
    [templates]
  );

  useEffect(() => setTotalItems?.(rows.length), [rows.length, setTotalItems]);

  /* ---------- UI state ---------- */
  const [selected, setSelected] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [initialData, setInitialData] =
    useState<Partial<TemplateFormValues> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  /* ---------- Mutations ---------- */
  const createMutation = useMutation({
    mutationFn: (data: TemplateFormValues) =>
      TemplateService.createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: TemplateFormValues) => {
      if (!editingId) throw new Error("Missing id for update");
      return TemplateService.updateTemplate(editingId, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => TemplateService.deleteTemplate(String(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setIsDeleteOpen(false);
      setDeleteId(null);
      setIsSuccessOpen(true);
    },
  });

  /* ---------- Handlers ---------- */
  const openCreate = () => {
    setMode("create");
    setInitialData(null);
    setEditingId(null);
    setIsOpen(true);
  };

  const openEdit = (row: TemplateRow) => {
    setMode("edit");
    setEditingId(String(row.id));
    setInitialData({
      id: row.id,
      templateName: row.name,
      headerRows: row.headerRows,
      footerRows: row.footerRows,
      fieldDelimiter: row.delimiter,
    });
    setIsOpen(true);
  };

  const toggleRow = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  useEffect(() => {
    if (isSuccessOpen) {
      const t = setTimeout(() => setIsSuccessOpen(false), 1600);
      return () => clearTimeout(t);
    }
  }, [isSuccessOpen]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(page);

  // Keep local page in sync with external page prop
  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  // Clamp page when data size/perPage change (prevents "invisible" pagination)
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [rows.length, perPage, currentPage]);

  // Compute page rows
  const pageRows = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return rows.slice(startIndex, startIndex + perPage);
  }, [rows, currentPage, perPage]);

  // If current page changes externally via control, propagate up
  const handlePageChange = (newPage: number) => {
    onPageChange?.(newPage);
    setCurrentPage(newPage);
  };

  return (
    <div className="p-2">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <Button
          onClick={openCreate}
          className="bg-blue3 hover:bg-blue3/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("newTemplate")}
        </Button>
      </div>

      {/* Table container */}
      <div className="border rounded-md overflow-hidden">
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)] min-h-[320px]">
          <table className="min-w-[900px] w-full text-sm border-separate border-spacing-0 table-fixed">
            <thead className="sticky top-0 z-10 bg-white shadow-sm text-gray-700 text-xs md:text-sm font-semibold">
              <tr className="border-b border-gray-200">
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={
                      pageRows.length > 0 && selected.length === pageRows.length
                    }
                    onCheckedChange={() =>
                      setSelected((prev) =>
                        prev.length === pageRows.length
                          ? []
                          : pageRows.map((r) => r.id)
                      )
                    }
                  />
                </th>
                <th className="px-4 py-3">{t("table.templateName")}</th>
                <th className="px-4 py-3">{t("table.headerRows")}</th>
                <th className="px-4 py-3">{t("table.footerRows")}</th>
                <th className="px-4 py-3">{t("table.fieldDelimiter")}</th>
                <th className="px-4 py-3 text-center">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b">
                    {Array(6)
                      .fill(null)
                      .map((_, idx) => (
                        <td key={idx} className="px-4 py-2">
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                        </td>
                      ))}
                  </tr>
                ))
              ) : pageRows.length ? (
                pageRows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.includes(row.id)}
                        onCheckedChange={() => toggleRow(row.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center break-words whitespace-normal">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-center">{row.headerRows}</td>
                    <td className="px-4 py-3 text-center">{row.footerRows}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary">{row.delimiter}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          onClick={() => openEdit(row)}
                          variant="ghost"
                          className="hover:bg-transparent"
                          title={t("edit")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setDeleteId(row.id);
                            setIsDeleteOpen(true);
                          }}
                          variant="ghost"
                          className="hover:bg-transparent"
                          title={t("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b">
                  <td
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                    colSpan={6}
                  >
                    {t("noRows")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">
                {mode === "create" ? t("createTitle") : t("editTitle")}
              </h2>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
                aria-label={tc("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 sm:px-6 py-4 sm:py-6">
              <TemplateForm
                mode={mode}
                initialData={initialData || undefined}
                onSubmit={(values) => {
                  if (mode === "create") createMutation.mutate(values);
                  else updateMutation.mutate({ ...values, id: editingId! });
                }}
              />
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/toast */}
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        onCancel={() => setIsDeleteOpen(false)}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
      />
      <SuccessDialog
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        title={t("deletedTitle")}
        message={t("deletedMessage")}
      />

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="mt-4">
          <PaginationControls
            currentPage={currentPage}
            totalItems={rows.length}
            itemsPerPage={perPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
