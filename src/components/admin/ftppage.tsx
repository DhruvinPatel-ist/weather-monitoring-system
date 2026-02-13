"use client";

import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import {
  FtpConfigurationModal,
  FtpConfigData,
} from "./form/ftp-configuration-modal";
// import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { FtpService } from "@/services/userService";
import { FtpConfigApi } from "@/types/user";
import {
  ConfirmDeleteModal,
  SuccessDialog,
} from "@/components/admin/models/ConfirmDeleteModal";

import { useTranslations } from "next-intl";
import PaginationControls from "@/hooks/shared/PaginationControls";

interface FTPConfigurationProps {
  page: number;
  perPage: number;
  onPageChange?: (newPage: number) => void;
  setTotalItems?: (n: number) => void;
}

export default function FTPConfiguration({
  page,
  perPage,
  onPageChange,
  setTotalItems,
}: FTPConfigurationProps) {
  const t = useTranslations("FTPConfiguration");
  const queryClient = useQueryClient();

  const { data: ftpConfigs = [] } = useQuery<FtpConfigApi[]>({
    queryKey: ["ftpStations"],
    queryFn: FtpService.getFtpStations,
    staleTime: 5 * 60 * 1000,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [initialData, setInitialData] = useState<FtpConfigData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: any) => FtpService.createFtpStation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ftpStations"] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: Partial<FtpConfigApi> }) =>
      FtpService.updateFtpStation(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ftpStations"] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => FtpService.deleteFtpStation(id.toString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ftpStations"] });
      setIsDeleteModalOpen(false);
      setDeleteId(null);
      setIsSuccessModalOpen(true);
    },
  });

  const handleOpenCreate = () => {
    setMode("create");
    setInitialData(null);
    setEditingId(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (config: FtpConfigApi) => {
    setMode("edit");
    setEditingId(config.id.toString());
    setInitialData({
      id: config.id.toString(),
      site_id: config.site_id ?? "",
      ftp_username: config.ftp_user ?? "",
      ftp_password: config.ftp_pass ?? "",
      ftp_server_ip: config.file_url ?? "",
      remote_file_path: config.sub_directory ?? "",
      ftp_server_port: config.ftp_port.toString(),
      update_interval: config.default_interval.toString(),
      server_status: config.status ?? "",
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = (data: {
    id?: string;
    site_id: string;
    file_url: string;
    sub_directory: string;
    ftp_port: number;
    ftp_user: string;
    ftp_pass: string;
    default_interval: number;
    status: string;
  }) => {
    if (mode === "create") {
      createMutation.mutate({
        file_url: data.file_url,
        start_reading_line: 1,
        site_id: data.site_id,
        ftp_port: data.ftp_port,
        ftp_user: data.ftp_user,
        ftp_pass: data.ftp_pass,
        default_interval: data.default_interval,
        sub_directory: data.sub_directory,
      });
    } else if (mode === "edit" && editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          site_id: data.site_id, // ✅ Include this line
          file_url: data.file_url,
          ftp_port: data.ftp_port,
          ftp_user: data.ftp_user,
          ftp_pass: data.ftp_pass,
          default_interval: data.default_interval,
          sub_directory: data.sub_directory,
          status: data.status,
        },
      });
    }
  };

  const handleSelectRow = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  const handleStatusToggle = (id: number, checked: boolean) => {
    updateMutation.mutate({
      id: id.toString(),
      data: { status: checked ? "Active" : "Inactive" },
    });
  };

  useEffect(() => {
    if (isSuccessModalOpen) {
      const timer = setTimeout(() => setIsSuccessModalOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessModalOpen]);

  useEffect(() => {
    if (setTotalItems) setTotalItems(ftpConfigs.length); // or users.length
  }, [ftpConfigs, setTotalItems]); // or [users, setTotalItems]

  // PAGINATION: Slice the data for the current page using props
  const startIndex = (page - 1) * perPage;
  const paginatedFtpConfigs = ftpConfigs.slice(
    startIndex,
    startIndex + perPage
  );

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-[#101828]">{t("title")}</h1>
        <Button
          onClick={handleOpenCreate}
          className="bg-blue3 hover:bg-blue3/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> {t("newConfiguration")}
        </Button>
      </div>

      <div
        className="border rounded-md overflow-hidden"
        dir={typeof document !== "undefined" ? document.dir : "ltr"}
      >
        <div className="w-full overflow-x-auto max-h-[calc(100vh-380px)] min-h-[300px]">
          <table className="min-w-[1000px] w-full text-sm rtl:text-right ltr:text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white shadow-sm text-gray-700 text-xs md:text-sm font-semibold">
              <tr className="border-b border-gray-200">
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={
                      selectedRows.length === ftpConfigs.length &&
                      ftpConfigs.length > 0
                    }
                    onCheckedChange={() => {
                      if (selectedRows.length === ftpConfigs.length) {
                        setSelectedRows([]);
                      } else {
                        setSelectedRows(
                          ftpConfigs.map((row) => Number(row.id))
                        );
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-center">{t("ipAddress")}</th>
                <th className="px-4 py-3 text-center">{t("port")}</th>
                <th className="px-4 py-3 text-center">{t("username")}</th>
                <th className="px-4 py-3 text-center">{t("FilePath")}</th>
                <th className="px-4 py-3 text-center">{t("status")}</th>
                <th className="px-4 py-3 text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFtpConfigs.length > 0
                ? paginatedFtpConfigs.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedRows.includes(Number(row.id))}
                          onCheckedChange={() =>
                            handleSelectRow(Number(row.id))
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-center">{row.file_url}</td>
                      <td className="px-4 py-3 text-center">{row.ftp_port}</td>
                      <td className="px-4 py-3 text-center">{row.ftp_user}</td>
                      <td className="px-4 py-3 text-center">
                        {row.sub_directory}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2 rtl:flex-row-reverse">
                          <Switch
                            checked={row.status === "Active"}
                            onCheckedChange={(checked) =>
                              handleStatusToggle(Number(row.id), checked)
                            }
                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200"
                          />
                          <span
                            className={
                              row.status === "Active"
                                ? "text-green-500"
                                : "text-gray-500"
                            }
                          >
                            {t(row.status ?? "")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2 rtl:flex-row-reverse">
                          <Button
                            onClick={() => handleOpenEdit(row)}
                            variant="ghost"
                            className="hover:bg-transparent"
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
                              setDeleteId(Number(row.id));
                              setIsDeleteModalOpen(true);
                            }}
                            variant="ghost"
                            className="hover:bg-transparent"
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
                : [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array(7)
                        .fill(null)
                        .map((_, idx) => (
                          <td key={idx} className="px-4 py-3">
                            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                          </td>
                        ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <FtpConfigurationModal
        isOpen={isOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        initialData={initialData}
        mode={mode}
      />

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

      {ftpConfigs.length > 0 && (
        <PaginationControls
          currentPage={page}
          totalItems={ftpConfigs.length}
          itemsPerPage={perPage}
          onPageChange={onPageChange ?? (() => {})}
        />
      )}
    </div>
  );
}
