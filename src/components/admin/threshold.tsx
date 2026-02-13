"use client";

import { useState, useEffect } from "react";
import { useThresholds } from "@/hooks/useThresholds";
import { useThresholdMutations } from "@/hooks/useThresholdMutations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Threshold } from "@/types/threshold";
import { ThresholdFormModal } from "@/components/admin/form/ThresholdFormModal";
import {
  ConfirmDeleteModal,
  SuccessDialog,
} from "@/components/admin/models/ConfirmDeleteModal";
import { format } from "date-fns";
import Image from "next/image";
// import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useTranslations } from "next-intl";
import PaginationControls from "@/hooks/shared/PaginationControls";
import { useAllParameters } from "@/hooks/useAllParameters";

interface ThresholdManagementProps {
  page: number;
  perPage: number;
  onPageChange?: (newPage: number) => void;
  setTotalItems?: (n: number) => void;
}

export default function ThresholdManagement({
  page,
  perPage,
  onPageChange,
  setTotalItems,
}: ThresholdManagementProps) {
  const t = useTranslations("ThresholdManagement");

  const { data: thresholds = [], isLoading, isError } = useThresholds();
  const { remove } = useThresholdMutations();
  const { getParameterName } = useAllParameters(); // Add the hook to get parameter names

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null); // Accept new format
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // const isMobileOrTablet = useDeviceDetection();

  const openModal = (mode: "create" | "edit", threshold?: Threshold) => {
    setMode(mode);

    if (mode === "edit" && threshold) {
      // Make sure all required properties exist for editing
      const parameterId = threshold.ParameterID || threshold.attribute_id || "";
      const siteId = threshold.SiteID || "";

      // Prefetch parameter data for this station to ensure we have parameter names available
      if (siteId) {
        fetchParametersForStation(siteId);
      }

      const updatedThreshold = {
        ...threshold,
        // Ensure these properties exist for the modal
        SiteID: siteId,
        ParameterID: parameterId,
      };

      console.log("Editing threshold:", updatedThreshold);
      setSelected(updatedThreshold);
    } else {
      setSelected(null);
    }

    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await remove.mutateAsync(deleteId);
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setIsSuccessModalOpen(true);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => setIsSuccessModalOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);

  useEffect(() => {
    if (setTotalItems) setTotalItems(thresholds.length);
  }, [thresholds, setTotalItems]);

  // Load parameter data for all unique station IDs
  const { fetchParametersForStation } = useAllParameters();
  useEffect(() => {
    if (!isLoading && thresholds.length > 0) {
      // Get unique station IDs
      const uniqueStationIds = new Set<string | number>();
      thresholds.forEach((threshold: any) => {
        if (threshold.SiteID) {
          uniqueStationIds.add(threshold.SiteID);
        }
      });

      // Fetch parameters for each station
      Array.from(uniqueStationIds).forEach((stationId) => {
        fetchParametersForStation(stationId);
      });
    }
  }, [thresholds, isLoading]);

  function handleCancel() {
    setIsDeleteModalOpen(false);
    setDeleteId(null);
  }

  const startIndex = (page - 1) * perPage;
  const paginatedThresholds = thresholds.slice(
    startIndex,
    startIndex + perPage
  );

  return (
    <div className="w-full p-2">
      <div className="flex items-center justify-between mt-4 mb-4">
        <h2 className="text-xl font-semibold text-[#252c32]">{t("title")}</h2>
        <Button
          onClick={() => openModal("create")}
          className="gap-2 bg-[#009fac] hover:bg-[#008a96] text-white text-xs"
        >
          + {t("addThreshold")}
        </Button>
      </div>

      <div
        className="border rounded-md overflow-hidden"
        dir={typeof document !== "undefined" ? document.dir : "ltr"}
      >
        <div className="w-full overflow-x-auto max-h-[calc(100vh-390px)]">
          <table className="min-w-[1000px] w-full text-sm text-left rtl:text-right">
            <thead className="sticky top-0 bg-white shadow-sm text-gray-700 text-xs md:text-sm font-semibold">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 w-12">
                  <Checkbox
                    checked={
                      selectedRows.length === thresholds.length &&
                      thresholds.length > 0
                    }
                    onCheckedChange={() => {
                      if (selectedRows.length === thresholds.length) {
                        setSelectedRows([]);
                      } else {
                        setSelectedRows(thresholds.map((row) => row.id!));
                      }
                    }}
                  />
                </th>
                <th className="py-3 px-4 text-center">{t("parameter")}</th>
                <th className="py-3 px-4 text-center">{t("thresholdName")}</th>
                <th className="py-3 px-4 text-center">Comparator</th>
                <th className="py-3 px-4 text-center">Value</th>
                <th className="py-3 px-4 text-center">{t("interval")}</th>
                <th className="py-3 px-4 text-center">{t("createdDate")}</th>
                <th className="py-3 px-4 text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    {Array(8)
                      .fill(null)
                      .map((_, idx) => (
                        <td key={idx} className="py-3 px-4">
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                        </td>
                      ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-red-500">
                    {t("loadFailed")}
                  </td>
                </tr>
              ) : thresholds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    {t("noThresholds")}
                  </td>
                </tr>
              ) : (
                paginatedThresholds.map((t) => {
                  // Support both old and new API formats using type assertion
                  const threshold = t as any;
                  const id = threshold.ID ?? threshold.id;
                  const parameterId =
                    threshold.ParameterID ?? threshold.attribute_id;
                  const comparator =
                    threshold.Comparator ??
                    `${threshold.minValue !== undefined ? ">=" : ""}`;
                  const value =
                    threshold.Value ?? threshold.maxValue ?? threshold.minValue;
                  const timeInterval =
                    typeof threshold.timeInterval === "number"
                      ? `${threshold.timeInterval} min`
                      : threshold.timeInterval;
                  return (
                    <tr
                      key={id}
                      className="border-b hover:bg-gray-50 transition-all"
                    >
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedRows.includes(id)}
                          onCheckedChange={() => handleSelectRow(id)}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        {threshold.parameterName ||
                          getParameterName(parameterId, threshold.SiteID) ||
                          parameterId ||
                          "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {threshold.threshold_name}
                      </td>
                      <td className="py-3 px-4 text-center">{comparator}</td>
                      <td className="py-3 px-4 text-center">{value}</td>
                      <td className="py-3 px-4 text-center">{timeInterval}</td>
                      <td className="py-3 px-4 text-center">
                        {format(new Date(threshold.CreatedAt), "d MMM yyyy")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2 rtl:flex-row-reverse">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openModal("edit", threshold)}
                          >
                            <Image
                              src="/Setting/edit.svg"
                              alt="edit"
                              width={20}
                              height={20}
                            />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setDeleteId(id);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Image
                              src="/Setting/delete.svg"
                              alt="delete"
                              width={20}
                              height={20}
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ThresholdFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={mode}
        initialData={selected}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onConfirm={handleDelete}
        onCancel={handleCancel}
        title={t("deleteTitle")}
        description={t("deleteConfirm")}
        confirmLabel={t("deleteLabel")}
      />

      <SuccessDialog
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={t("deletedTitle")}
        message={t("deletedMessage")}
      />

      {!isLoading && thresholds.length > 0 && (
        <PaginationControls
          currentPage={page}
          totalItems={thresholds.length}
          itemsPerPage={perPage}
          onPageChange={onPageChange ?? (() => {})}
        />
      )}
    </div>
  );
}
