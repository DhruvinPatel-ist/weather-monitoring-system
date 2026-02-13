// email-config-form.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import { Badge } from "@/components/ui/badge";
import { useStations } from "@/hooks/useDashboard";

/* ---------- Types ---------- */
export interface EmailConfigFormData {
  stationId: string; // keep string for the Select
  emailIds: string[];
}

export type EmailConfigSubmitPayload = {
  stationId: number;
  emailIds: string[];
};

interface EmailConfigurationFormProps {
  mode: "create" | "edit";
  initialData?: Partial<EmailConfigSubmitPayload>;
  onSubmit: (payload: EmailConfigSubmitPayload) => void;
}

export function EmailConfigurationForm({
  mode,
  initialData,
  onSubmit,
}: EmailConfigurationFormProps) {
  const t = useTranslations("EmailConfiguration");
  const { data: stations = [] } = useStations();
  console.log(initialData);

  const [form, setForm] = useState<EmailConfigFormData>({
    stationId: "",
    emailIds: [],
  });

  // Prefill when editing
  useEffect(() => {
    if (initialData) {
      setForm({
        stationId:
          initialData.stationId !== undefined
            ? String(initialData.stationId)
            : "",
        emailIds: initialData.emailIds || [],
      });
    }
  }, [initialData]);

  // email staging
  const [emailInput, setEmailInput] = useState("");

  const addEmail = () => {
    const e = emailInput.trim();
    if (!e) return;
    if (form.emailIds.includes(e)) return;
    setForm((f) => ({ ...f, emailIds: [...f.emailIds, e] }));
    setEmailInput("");
  };

  const removeEmail = (idx: number) =>
    setForm((f) => ({
      ...f,
      emailIds: f.emailIds.filter((_, i) => i !== idx),
    }));

  const apiPayload: EmailConfigSubmitPayload = useMemo(
    () => ({
      stationId: parseInt(form.stationId, 10),
      emailIds: form.emailIds,
    }),
    [form]
  );

  const isValid = !!form.stationId && form.emailIds.length > 0;

  // Ensure option values are strings (Select expects string)
  const stationOptions =
    (stations || []).map((s: any) => {
      const idRaw = s.id ?? s.station_id ?? s.site_id ?? "";
      const nameRaw =
        s.name ?? s.station_name ?? s.site_name ?? String(idRaw ?? "");
      return {
        value: String(idRaw),
        label: String(nameRaw),
      };
    }) ?? [];

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <h1 className="text-lg font-semibold mb-4">
        {mode === "create" ? t("createTitle") : t("editTitle")}
      </h1>

      {/* Station select - only show in create mode */}
      {mode === "create" && (
        <div className="rounded-md border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectWrap
              label={t("site")}
              value={form.stationId}
              onValueChange={(v) => setForm((f) => ({ ...f, stationId: v }))}
              options={stationOptions}
              placeholder={t("selectSite")}
            />
          </div>
        </div>
      )}

      {/* Emails */}
      <div className="rounded-md border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <InputWrap
            label={t("email")}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="abc@gmail.com"
          />
          <div className="flex items-end">
            <Button onClick={addEmail} className="w-full md:w-auto">
              {t("add")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {form.emailIds.map((e, i) => (
            <Badge
              key={e + i}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {e}
              <button
                className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => removeEmail(i)}
                aria-label={t("remove")}
              >
                ✕
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          disabled={!isValid}
          onClick={() => onSubmit(apiPayload)}
        >
          {mode === "create" ? t("addEmailConfiguration") : t("saveChanges")}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Small helpers ---------- */
function InputWrap({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        type={type}
        className="border border-gray-300 focus-visible:ring-0"
      />
    </div>
  );
}

function SelectWrap({
  label,
  value,
  onValueChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border border-gray-300 focus-visible:ring-0">
          <SelectValue placeholder={placeholder || `Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
