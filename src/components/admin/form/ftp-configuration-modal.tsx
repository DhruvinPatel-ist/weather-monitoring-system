"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStations } from "@/hooks/useDashboard";
import { useTranslations } from "next-intl";

export interface FtpConfigData {
  id?: string;
  site_id: string;
  ftp_username: string;
  ftp_password: string;
  ftp_server_ip: string;
  remote_file_path: string;
  ftp_server_port: string;
  update_interval: string;
  server_status: string;
}

interface FtpConfigFormProps {
  isOpen: boolean;
  onClose: () => void;
  // Note: onSubmit now expects the API payload shape
  onSubmit: (payload: {
    id?: string;
    site_id: string;
    file_url: string;
    sub_directory: string;
    ftp_port: number;
    ftp_user: string;
    ftp_pass: string;
    default_interval: number;
    status: string;
  }) => void;
  initialData?: FtpConfigData | null;
  mode: "create" | "edit";
}

export function FtpConfigurationModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: FtpConfigFormProps) {
  const t = useTranslations("FTPConfiguration");

  const [ftpData, setFtpData] = useState<FtpConfigData>({
    site_id: "",
    ftp_username: "",
    ftp_password: "",
    ftp_server_ip: "",
    remote_file_path: "",
    ftp_server_port: "21",
    update_interval: "30 Minutes",
    server_status: "Active",
  });

  const { data: stations = [] } = useStations();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFtpData({
        ...initialData,
        update_interval:
          formatInterval(initialData.update_interval) || "30 Minutes",
      });
    } else {
      setFtpData({
        site_id: "",
        ftp_username: "",
        ftp_password: "",
        ftp_server_ip: "",
        remote_file_path: "",
        ftp_server_port: "21",
        update_interval: "15 Minutes",
        server_status: "Active",
      });
    }
    setShowSuccess(false);
  }, [initialData, mode, isOpen]);

  const formatInterval = (value: string | number) => {
    switch (String(value)) {
      case "15":
        return "15 Minutes";
      case "30":
        return "30 Minutes";
      case "1":
      case "60":
        return "1 Hour";
      case "120":
        return "2 Hours";
      case "360":
      case "3600":
        return "6 Hours";
      case "720":
      case "7200":
        return "12 Hours";
      case "1440":
      case "14400":
        return "24 Hours";
      default:
        return "30 Minutes";
    }
  };

  const parseInterval = (value: string) => {
    switch (value) {
      case "15 Minutes":
        return 15;
      case "30 Minutes":
        return 30;
      case "1 Hour":
        return 60;
      case "2 Hours":
        return 120;
      case "6 Hours":
        return 360;
      case "12 Hours":
        return 720;
      case "24 Hours":
        return 1440;
      default:
        return 30;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFtpData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFtpData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      id: initialData?.id, // Optional, included only in edit mode
      site_id: ftpData.site_id, // ✅ Always include site_id
      file_url: ftpData.ftp_server_ip,
      sub_directory: ftpData.remote_file_path,
      ftp_port: Number(ftpData.ftp_server_port),
      ftp_user: ftpData.ftp_username,
      ftp_pass: ftpData.ftp_password,
      default_interval: parseInterval(ftpData.update_interval),
      status: ftpData.server_status,
    };

    onSubmit(payload);
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (showSuccess) {
    return (
      <Dialog open={isOpen}>
        <DialogContent className="flex flex-col items-center justify-center py-10">
          <div className="h-20 w-20 rounded-full bg-[#009fac] flex items-center justify-center mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17L4 12"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-center text-[#009fac]">
            {t("configSavedSuccess")}
          </h2>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[550px] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("createConfiguration")
              : t("editConfiguration")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="ftp-form" className="space-y-4"  autoComplete="off">
          <div className="space-y-2">
            <Label>{t("site")}</Label>
            <Select
              value={ftpData.site_id}
              onValueChange={(value) => {
                setFtpData((prev) => ({ ...prev, site_id: value }));
              }}
            >
              <SelectTrigger className="w-full text-black">
                <SelectValue placeholder={t("selectSite")} />
              </SelectTrigger>
              <SelectContent>
                {stations.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <InputWithLabel
            label={t("ftpUsername")}
            name="ftp_username"
            value={ftpData.ftp_username}
            onChange={handleChange}
          />
          <InputWithLabel
            label={t("ftpPassword")}
            name="ftp_password"
            value={ftpData.ftp_password}
            onChange={handleChange}
            type="password"
          />
          <InputWithLabel
            label={t("ftpServerIP")}
            name="ftp_server_ip"
            value={ftpData.ftp_server_ip}
            onChange={handleChange}
          />
          <InputWithLabel
            label={t("remoteFilePath")}
            name="remote_file_path"
            value={ftpData.remote_file_path}
            onChange={handleChange}
          />
          <InputWithLabel
            label={t("ftpServerPort")}
            name="ftp_server_port"
            value={ftpData.ftp_server_port}
            onChange={handleChange}
          />

          <SelectInput
            label={t("updateInterval")}
            value={ftpData.update_interval}
            options={[
              "15 Minutes",
              "30 Minutes",
              "1 Hour",
              "2 Hours",
              "6 Hours",
              "12 Hours",
              "24 Hours",
            ]}
            onValueChange={(value) =>
              handleSelectChange("update_interval", value)
            }
          />

          <SelectInput
            label={t("serverStatus")}
            value={ftpData.server_status}
            options={["Active", "Inactive"]}
            onValueChange={(value) =>
              handleSelectChange("server_status", value)
            }
          />

          <Button
            type="submit"
            className="w-full mt-4 bg-blue3 hover:bg-blue3 text-white"
          >
            {mode === "create" ? t("create") : t("update")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InputWithLabel({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={label}
        className="border border-gray-300 focus-visible:ring-0"
        required
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border border-gray-300 focus-visible:ring-0">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
