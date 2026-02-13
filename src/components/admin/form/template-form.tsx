"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TemplateService,
  DataFieldValue,
  ParameterDriverValue,
} from "@/services/templateService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

/* ---------- FE Form Types (consumed by TemplateService) ---------- */
export type TemplateFormValues = {
  id?: string | number;
  templateName: string;
  headerRows: number;
  footerRows: number;
  fieldDelimiter: string; // "Comma" | "Tab" | "Semicolon" | "Pipe" | "Whitespace"
  metadata: Array<{
    columnNumber: number;
    dataFieldId: number;
    parameterDriverId: number | null;
    dateFormat: string | null;
  }>;
};

export function TemplateForm({
  mode,
  initialData,
  onSubmit,
}: {
  mode: "create" | "edit";
  initialData?: Partial<TemplateFormValues> & { [key: string]: any };
  onSubmit: (payload: TemplateFormValues) => void;
}) {
  const t = useTranslations("Template");
  const DELIMITER_OPTIONS = ["Comma", "Tab", "Semicolon", "Pipe", "Whitespace"];

  const [dataFields, setDataFields] = useState<DataFieldValue[]>([]);
  const [parameterDrivers, setParameterDrivers] = useState<
    ParameterDriverValue[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState<TemplateFormValues>({
    templateName: "",
    headerRows: 0,
    footerRows: 0,
    fieldDelimiter: "Whitespace",
    metadata: [
      {
        columnNumber: 1,
        dataFieldId: 0,
        parameterDriverId: null,
        dateFormat: null,
      },
    ],
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      setIsLoading(true);
      try {
        const [fieldsResponse, driversResponse] = await Promise.all([
          TemplateService.getDataFields(),
          TemplateService.getParameterDrivers(),
        ]);

        setDataFields(Array.isArray(fieldsResponse) ? fieldsResponse : []);
        setParameterDrivers(
          Array.isArray(driversResponse) ? driversResponse : []
        );
        toast.success("Form data loaded successfully");
      } catch (error: any) {
        console.error("Error fetching form dependencies:", error);

        let errorMessage = "Failed to load dropdown data";
        if (error?.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        setDataFields([]);
        setParameterDrivers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDependencies();
  }, []);

  useEffect(() => {
    const fetchTemplateData = async () => {
      if (initialData && mode === "edit" && initialData.id) {
        try {
          const templateData = await TemplateService.getTemplate(
            initialData.id
          );
          if (templateData) {
            setForm((prev) => ({
              ...prev,
              templateName: templateData.TemplateName || "",
              headerRows: Number(templateData.NumberOfHeaderRows || 0),
              footerRows: Number(templateData.NumberOfFooterRows || 0),
              fieldDelimiter: templateData.FieldDelimiter || "Whitespace",
              metadata: Array.isArray(templateData.Metadata)
                ? templateData.Metadata.map((m) => ({
                    columnNumber: Number(m.ColumnNumber || 0),
                    dataFieldId: Number(m.DataFieldID || 0),
                    parameterDriverId:
                      m.ParameterDriverID !== null
                        ? Number(m.ParameterDriverID)
                        : null,
                    dateFormat: m.DateFormat || null,
                  }))
                : prev.metadata,
            }));
            toast.success("Template loaded for editing");
          }
        } catch (error: any) {
          console.error("Error fetching template details:", error);

          let errorMessage = "Failed to load template details";
          if (error?.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          toast.error(errorMessage);
          // Fallback to initial data if API call fails
          setForm((prev) => ({
            ...prev,
            templateName: initialData.templateName || "",
            headerRows: Number(initialData.headerRows || 0),
            footerRows: Number(initialData.footerRows || 0),
            fieldDelimiter: initialData.fieldDelimiter || "Whitespace",
            metadata: prev.metadata,
          }));
        }
      } else if (initialData) {
        setForm((prev) => ({
          ...prev,
          templateName: initialData.templateName || "",
          headerRows: Number(initialData.headerRows || 0),
          footerRows: Number(initialData.footerRows || 0),
          fieldDelimiter: initialData.fieldDelimiter || "Whitespace",
          metadata: prev.metadata,
        }));
      }
    };

    fetchTemplateData();
  }, [initialData, mode]);

  const isValid =
    (form.templateName?.trim()?.length || 0) > 0 &&
    Array.isArray(form.metadata) &&
    form.metadata.length > 0 &&
    form.metadata.every((m) => m.columnNumber > 0 && m.dataFieldId > 0) &&
    !isLoading;

  const addRow = () =>
    setForm((f) => {
      const next = (f.metadata.at(-1)?.columnNumber ?? f.metadata.length) + 1;
      return {
        ...f,
        metadata: [
          ...f.metadata,
          {
            columnNumber: next,
            dataFieldId: dataFields.length > 0 ? dataFields[0].ID : 0,
            parameterDriverId: null,
            dateFormat: null,
          },
        ],
      };
    });

  const removeRow = (idx: number) =>
    setForm((f) => ({
      ...f,
      metadata: f.metadata.filter((_, i) => i !== idx),
    }));

  const updateMeta = <K extends keyof TemplateFormValues["metadata"][number]>(
    idx: number,
    key: K,
    value: TemplateFormValues["metadata"][number][K]
  ) =>
    setForm((f) => ({
      ...f,
      metadata: f.metadata.map((m, i) =>
        i === idx ? { ...m, [key]: value } : m
      ),
    }));

  const handleSubmit = async () => {
    try {
      await onSubmit(payload);
      toast.success(
        mode === "create"
          ? "Template created successfully"
          : "Template updated successfully"
      );
    } catch (error: any) {
      console.error("Error submitting template:", error);

      // Extract error message from API response
      let errorMessage =
        mode === "create"
          ? "Failed to create template"
          : "Failed to update template";

      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const payload: TemplateFormValues = useMemo(
    () => ({
      id: initialData?.id,
      templateName: form.templateName.trim(),
      headerRows: Number(form.headerRows),
      footerRows: Number(form.footerRows),
      fieldDelimiter: form.fieldDelimiter,
      metadata: form.metadata.map((m, i) => ({
        columnNumber: Number(m.columnNumber || i + 1),
        dataFieldId: Number(m.dataFieldId || 0),
        DateFormat: String(m.dateFormat || ""),
        parameterDriverId:
          m.parameterDriverId === undefined ? null : m.parameterDriverId,
        dateFormat: m.dateFormat ? String(m.dateFormat) : null,
      })),
    }),
    [form, initialData?.id]
  );

  return (
    <div className="w-full">
      <h3 className="text-base font-semibold mb-4">
        {mode === "create" ? t("createTitle") : t("editTitle")}
      </h3>

      {isLoading && (
        <div className="flex items-center justify-center py-4 mb-4">
          <div className="text-sm text-gray-500">Loading form data...</div>
        </div>
      )}

      {/* Top grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <LabeledInput
          label={t("form.templateName")}
          value={form.templateName}
          onChange={(v) => setForm((f) => ({ ...f, templateName: v }))}
          placeholder={t("form.templatePlaceholder")}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <LabeledNumber
            label={t("form.headerRows")}
            value={form.headerRows}
            min={0}
            onChange={(v) => setForm((f) => ({ ...f, headerRows: v }))}
          />
          <LabeledNumber
            label={t("form.footerRows")}
            value={form.footerRows}
            min={0}
            onChange={(v) => setForm((f) => ({ ...f, footerRows: v }))}
          />
        </div>
        <LabeledSelect
          label={t("form.fieldDelimiter")}
          value={form.fieldDelimiter}
          options={DELIMITER_OPTIONS}
          onValueChange={(v) => setForm((f) => ({ ...f, fieldDelimiter: v }))}
        />
        {/* Keep space for status if you add later; UI footprint remains */}
        <div />
      </div>

      {/* Metadata rows */}
      <div className="rounded-md border p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">{t("columns.title")}</p>
          <Button onClick={addRow}>{t("columns.add")}</Button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {form.metadata.map((m, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              <LabeledNumber
                className="md:col-span-2"
                label={t("columns.columnNumber")}
                value={m.columnNumber || idx + 1}
                min={1}
                onChange={(v) => updateMeta(idx, "columnNumber", v)}
              />
              <LabeledSelect
                className="md:col-span-3"
                label={t("columns.dataField")}
                value={String(m.dataFieldId || "0")}
                options={
                  Array.isArray(dataFields) && dataFields.length > 0
                    ? dataFields.map((df) => ({
                        value: String(df.ID),
                        label: df.DataField,
                      }))
                    : [{ value: "0", label: "Loading..." }]
                }
                onValueChange={(v) => updateMeta(idx, "dataFieldId", Number(v))}
                disabled={isLoading}
              />
              {/* DateFormat dropdown */}
              <LabeledSelect
                className="md:col-span-3"
                label={t("columns.dateFormat")}
                value={m.dateFormat || ""}
                options={Array.from(new Set([
                  'yyyy-MM-dd HH:mm:ss',
                  'yyyy-MM-dd HH:mm',
                  "yyyy-MM-dd'T'HH:mm:ss",
                  "yyyy-MM-dd'T'HH:mm:ssZ",
                  "yyyy-MM-dd'T'HH:mm:ss.SSS",
                  "yyyy-MM-dd'T'HH:mm:ss.SSSZ",
                  'dd/MM/yyyy HH:mm:ss',
                  'MM/dd/yyyy HH:mm:ss',
                  'yyyy/MM/dd HH:mm:ss',
                  'MM-dd-yyyy HH:mm:ss',
                  'dd-MM-yyyy HH:mm:ss',
                  'dd.MM.yyyy HH:mm:ss',
                  'yyyy.MM.dd HH:mm:ss',
                  'yyyyMMdd HHmmss',
                  'ddMMyyyy HHmmss',
                  'MMddyyyy HHmmss',
                  'MM/dd/yyyy hh:mm:ss a',
                  'dd/MM/yyyy hh:mm:ss a',
                  'yyyy-MM-dd hh:mm:ss a',
                  'dd-MM-yyyy hh:mm:ss a',
                  'yyyy/MM/dd hh:mm:ss a',
                  'd MMM yyyy HH:mm:ss',
                  'd MMMM yyyy HH:mm:ss',
                  'dd-MM-yy HH:mm:ss',
                  'MM/dd/yy HH:mm:ss',
                  'yy-MM-dd HH:mm:ss',
                  "yyyy-MM-dd'T'HH:mm:ssZZ",
                  "yyyy-MM-dd'T'HH:mm:ss.SSSZZ"
                ])).map(f => ({ value: f, label: f }))}
                onValueChange={v => updateMeta(idx, "dateFormat", v)}
              />
              <LabeledSelect
                className="md:col-span-3"
                label={t("columns.parameterDriver")}
                value={
                  m.parameterDriverId ? String(m.parameterDriverId) : "none"
                }
                options={[
                  { value: "none", label: "None" },
                  ...(Array.isArray(parameterDrivers) &&
                  parameterDrivers.length > 0
                    ? parameterDrivers.map((pd) => ({
                        value: String(pd.ID),
                        label: pd.ParameterDriverName,
                      }))
                    : []),
                ]}
                onValueChange={(v) =>
                  updateMeta(
                    idx,
                    "parameterDriverId",
                    v === "none" ? null : Number(v)
                  )
                }
                disabled={isLoading}
              />
              <div className="md:col-span-1">
                <Button variant="outline" onClick={() => removeRow(idx)}>
                  {t("columns.remove")}
                </Button>
              </div>
            </div>
          ))}
          {form.metadata.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("columns.none")}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          disabled={!isValid || isLoading}
          onClick={handleSubmit}
        >
          {mode === "create" ? t("saveTemplate") : t("saveChanges")}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Small helpers ---------- */
function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        required={required}
        className="border border-gray-300 focus-visible:ring-0"
      />
    </div>
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
  min = 0,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="border border-gray-300 focus-visible:ring-0"
      />
    </div>
  );
}

type Opt = string | { value: string; label: string };

function LabeledSelect({
  label,
  value,
  options,
  onValueChange,
  className,
  disabled = false,
}: {
  label: string;
  value: string;
  options: Opt[];
  onValueChange: (v: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="border border-gray-300 focus-visible:ring-0">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) =>
            typeof o === "string" ? (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ) : (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
