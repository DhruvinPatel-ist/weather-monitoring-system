"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import api from "@/app/api/api";

/* ---------- Types ---------- */
type ParamSelection = {
  parameterName: string; // UI display
  unitName: string; // UI display
  parameterDriverId: number; // to send
  unitId: number; // to send
};

export interface SiteConfigFormData {
  station_name: string;
  station_id: string;
  parameters: ParamSelection[];
  connection_type: "FTP" | "HTTP" | "HTTPS" | "Azure" | string;

  /** selected template display name (optional, for convenience) */
  template_name?: string;
  /** numeric ID to send to API */
  filereadtemplateid?: number;
  start_reading_line?: string;

  // FTP block
  ftp_host?: string; // file_url
  ftp_port?: string;
  ftp_user?: string;
  ftp_pass?: string;
  ftp_remote_path?: string; // sub_directory
  ftp_default_interval?: string; // localized label like "1 Hour"

  status: "Active" | "Inactive";
  local_directory?: string;

  // meta
  longitude?: string;
  latitude?: string;
  region?: string;
  description?: string;
}

export type SiteConfigSubmitPayload = {
  title: string;
  longitude?: number;
  latitude?: number;
  status: "Active" | "Inactive";
  filereadtemplateid?: number;
  file_url?: string;
  start_reading_line?: number;
  ftp_port?: number;
  ftp_user?: string;
  ftp_pass?: string;
  default_interval?: number;
  sub_directory?: string;
  local_directory?: string;
  parameters: Array<{
    parameterName: string;
    unitId: number;
    parameterDriverId: number;
  }>;
};

/* ---------- SimpleOption ---------- */
type SimpleOption = { id: number | string; name: string };

/* ---------- Constants ---------- */
const CONNECTION_OPTIONS = ["FTP", "HTTP", "HTTPS", "Azure"] as const;

const PARAM_ENDPOINT = "/parameter-drivers";
const UNITS_ENDPOINT = "/units";
const TEMPLATES_ENDPOINT = "/templates";

/* ---------- Interval helpers ---------- */
function intervalMinutesToLabelMap(t: ReturnType<typeof useTranslations>) {
  return new Map<number, string>([
    [15, t("intervals.15m")],
    [30, t("intervals.30m")],
    [60, t("intervals.1h")],
    [120, t("intervals.2h")],
    [360, t("intervals.6h")],
    [720, t("intervals.12h")],
    [1440, t("intervals.24h")],
  ]);
}
function intervalLabelToMinutesMap(t: ReturnType<typeof useTranslations>) {
  const m = new Map<string, number>();
  const add = (label: string, minutes: number) => m.set(label, minutes);
  add(t("intervals.15m"), 15);
  add(t("intervals.30m"), 30);
  add(t("intervals.1h"), 60);
  add(t("intervals.2h"), 120);
  add(t("intervals.6h"), 360);
  add(t("intervals.12h"), 720);
  add(t("intervals.24h"), 1440);
  // English fallbacks
  add("15 Minutes", 15);
  add("30 Minutes", 30);
  add("1 Hour", 60);
  add("2 Hours", 120);
  add("6 Hours", 360);
  add("12 Hours", 720);
  add("24 Hours", 1440);
  return m;
}
function labelFromMinutesLocalized(
  minutes: number | string | undefined,
  t: ReturnType<typeof useTranslations>
): string {
  if (minutes == null) return t("intervals.30m");
  const map = intervalMinutesToLabelMap(t);
  const key = typeof minutes === "string" ? Number(minutes) : minutes;
  return map.get(key) ?? t("intervals.30m");
}
function minutesFromLabelLocalized(
  label: string | undefined,
  t: ReturnType<typeof useTranslations>
): number {
  if (!label) return 30;
  const map = intervalLabelToMinutesMap(t);
  return map.get(label) ?? 30;
}

/* ---------- Error helper ---------- */
function getErrorMessage(e: any, fallback = "Something went wrong") {
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.response?.data?.detail ||
    e?.message ||
    fallback
  );
}

/* ---------- Component ---------- */
export function SiteConfigurationForm({
  mode,
  initialData,
  onSubmit,
  apiBase = "",
}: {
  mode: "create" | "edit";
  initialData?: Partial<SiteConfigFormData> | null;
  onSubmit: (payload: SiteConfigSubmitPayload) => void;
  parameterOptions?: Array<{
    ParameterDriverID: number;
    ParameterDriverName: string;
    UnitID: number;
    UnitName: string;
  }>;
  apiBase?: string;
}) {
  const t = useTranslations("SiteConfiguration");

  const INTERVAL_OPTION_LABELS = [
    t("intervals.15m"),
    t("intervals.30m"),
    t("intervals.1h"),
    t("intervals.2h"),
    t("intervals.6h"),
    t("intervals.12h"),
    t("intervals.24h"),
  ];
  const STATUS_OPTIONS = [
    { value: "Active", label: t("active") },
    { value: "Inactive", label: t("inactive") },
  ];

  const [form, setForm] = useState<SiteConfigFormData>({
    station_name: "",
    station_id: "",
    parameters: [],
    connection_type: "FTP",
    template_name: undefined,
    filereadtemplateid: undefined,
    start_reading_line: "2",
    ftp_host: "",
    ftp_port: "21",
    ftp_user: "",
    ftp_pass: "",
    ftp_remote_path: "",
    ftp_default_interval: t("intervals.1h"),
    status: "Active",
    local_directory: "",
    longitude: "",
    latitude: "",
    region: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [paramOptionsState, setParamOptionsState] = useState<SimpleOption[]>(
    []
  );
  const [unitOptionsState, setUnitOptionsState] = useState<SimpleOption[]>([]);
  const [templateOptionsState, setTemplateOptionsState] = useState<
    SimpleOption[]
  >([]);

  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState<string>("");

  /* Seed station_id in edit mode */
  useEffect(() => {
    if (!initialData?.station_id) return;
    setForm((f) => ({ ...f, station_id: initialData.station_id! }));
  }, [initialData?.station_id]);

  /* Seed other initial data */
  useEffect(() => {
    if (!initialData) return;
    setForm((prev) => ({
      ...prev,
      ...initialData,
      ftp_default_interval: labelFromMinutesLocalized(
        (initialData as any)?.default_interval ??
          initialData.ftp_default_interval,
        t
      ),
      filereadtemplateid:
        initialData.filereadtemplateid ?? prev.filereadtemplateid,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, t]);

  /* Load param drivers, units, templates */
  useEffect(() => {
    let cancelled = false;

    const safeArray = (res: any) => {
      if (Array.isArray(res)) return res;
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.data?.data)) return res.data.data;
      if (Array.isArray(res?.data?.Data)) return res.data.Data;
      return [];
    };

    const mapParamDrivers = (arr: any[]): SimpleOption[] => {
      const m = new Map<string, string>();
      for (const r of arr ?? []) {
        const id =
          r.ID ??
          r.ParameterDriverID ??
          r.parameterDriverId ??
          r.id ??
          r.ParameterId ??
          r.parameterId;
        const name =
          r.ParameterDriverName ??
          r.parameterDriverName ??
          r.name ??
          r.ParameterName;
        if (id != null && name) m.set(String(id), String(name));
      }
      return [...m.entries()].map(([id, name]) => ({ id, name }));
    };

    const mapUnits = (arr: any[]): SimpleOption[] => {
      const m = new Map<string, string>();
      for (const r of arr ?? []) {
        const id = r.ID ?? r.UnitID ?? r.unitId ?? r.id;
        const name = r.UnitName ?? r.unitName ?? r.name;
        if (id != null && name) m.set(String(id), String(name));
      }
      return [...m.entries()].map(([id, name]) => ({ id, name }));
    };

    const mapTemplates = (arr: any[]): SimpleOption[] => {
      const m = new Map<string, string>();
      for (const r of arr ?? []) {
        const id = r.ID ?? r.id;
        const name =
          r.TemplateName ?? r.templateName ?? r.Name ?? r.name ?? "Template";
        if (id != null && name) m.set(String(id), String(name));
      }
      return [...m.entries()].map(([id, name]) => ({ id, name }));
    };

    const load = async () => {
      try {
        setOptionsLoading(true);
        setOptionsError("");

        const [pdRes, uRes, tplRes] = await Promise.all([
          api.get(`${apiBase}${PARAM_ENDPOINT}`),
          api.get(`${apiBase}${UNITS_ENDPOINT}`),
          api.get(`${apiBase}${TEMPLATES_ENDPOINT}`),
        ]);

        if (cancelled) return;

        const paramList = mapParamDrivers(safeArray(pdRes));
        const unitList = mapUnits(safeArray(uRes));
        const templateList = mapTemplates(safeArray(tplRes));

        setParamOptionsState((prev) => {
          const m = new Map<string, string>();
          [...prev, ...paramList].forEach((o) => m.set(String(o.id), o.name));
          return [...m.entries()].map(([id, name]) => ({ id, name }));
        });

        setUnitOptionsState((prev) => {
          const m = new Map<string, string>();
          [...prev, ...unitList].forEach((o) => m.set(String(o.id), o.name));
          return [...m.entries()].map(([id, name]) => ({ id, name }));
        });

        setTemplateOptionsState(() => {
          const m = new Map<string, string>();
          templateList.forEach((o) => m.set(String(o.id), o.name));
          const arr = [...m.entries()].map(([id, name]) => ({ id, name }));

          // If edit already has an ID, compute display name
          if (form.filereadtemplateid != null) {
            const selected = arr.find(
              (o) => Number(o.id) === Number(form.filereadtemplateid)
            );
            if (selected && selected.name) {
              setForm((f) => ({ ...f, template_name: selected.name }));
            }
          }
          return arr;
        });

        toast.success("Options loaded successfully");
      } catch (e: any) {
        if (!cancelled) {
          const errorMessage = getErrorMessage(
            e,
            "Failed to load options (parameters/units/templates)"
          );
          setOptionsError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  /* Edit: fetch site by id */
  useEffect(() => {
    const shouldFetch =
      mode === "edit" && form.station_id && form.station_id.trim() !== "";
    if (!shouldFetch) return;

    const cancelled = false;

    const fetchSite = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const res = await api.get(
          `${apiBase}/site-configuration/${encodeURIComponent(form.station_id)}`
        );

        const site: any = (res as any)?.data?.data ?? (res as any)?.data ?? res;
        if (cancelled) return;

        const mappedParams: ParamSelection[] = (site.parameters || []).map(
          (p: any) => ({
            parameterName:
              p.ParameterName ??
              p.parameterName ??
              p.ParameterDriverName ??
              "Parameter",
            unitName: p.UnitName ?? p.unitName ?? "Unit",
            parameterDriverId: Number(
              p.parameterDriverId ??
                p.ParameterDriverID ??
                p.ParameterId ??
                p.parameterId ??
                p.ID ??
                0
            ),
            unitId: Number(p.unitId ?? p.UnitID ?? p.ID ?? 0),
          })
        );

        const nextState: Partial<SiteConfigFormData> = {
          station_name: site.siteName || "",
          parameters: mappedParams,
          filereadtemplateid: site.filereadtemplateid,
          ftp_host: site.file_url || "",
          ftp_port:
            site.ftp_port != null ? String(site.ftp_port) : form.ftp_port,
          ftp_user: site.ftp_user || "",
          ftp_pass: site.ftp_pass || "",
          ftp_remote_path: site.sub_directory || "",
          start_reading_line:
            site.start_reading_line != null
              ? String(site.start_reading_line)
              : form.start_reading_line,
          ftp_default_interval: labelFromMinutesLocalized(
            site.default_interval,
            t
          ),
          status:site.siteStatus,
            /* (String(site.siteStatus) || "active").toLowerCase() === "active"
              ? "Active"
              : "Inactive", */
          longitude: site.longitude != null ? String(site.longitude) : "",
          latitude: site.latitude != null ? String(site.latitude) : "",
          local_directory: site.local_directory || "",
        };

        if (site.filereadtemplateid != null && templateOptionsState.length) {
          const selected = templateOptionsState.find(
            (o) => Number(o.id) === Number(site.filereadtemplateid)
          );
          if (selected) nextState.template_name = selected.name;
        }

        setForm((prev) => ({ ...prev, ...nextState }));

        toast.success("Site configuration loaded successfully");
      } catch (err: any) {
        const errorMessage = getErrorMessage(
          err,
          "Failed to load site configuration"
        );
        setErrorMsg(errorMessage);
        toast.error(errorMessage);
        console.error("Site fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, form.station_id, apiBase, t, templateOptionsState]);

  /* Temp selects */
  const [paramSel, setParamSel] = useState<string>("");
  const [unitSel, setUnitSel] = useState<string>("");

  /* Creatable dialogs */
  const [showParamDialog, setShowParamDialog] = useState(false);
  const [newParamName, setNewParamName] = useState("");
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitDescription, setNewUnitDescription] = useState("");

  const [creatingParam, setCreatingParam] = useState(false);
  const [creatingUnit, setCreatingUnit] = useState(false);
  const [createError, setCreateError] = useState<string>("");

  /* Build payload */
  const apiPayload = useMemo<SiteConfigSubmitPayload>(() => {
    const defaultInterval = minutesFromLabelLocalized(
      form.ftp_default_interval,
      t
    );
    const longitudeNum =
      form.longitude && form.longitude.trim() !== ""
        ? Number(form.longitude)
        : undefined;
    const latitudeNum =
      form.latitude && form.latitude.trim() !== ""
        ? Number(form.latitude)
        : undefined;
    return {
      title: form.station_name.trim(),
      longitude: isFinite(Number(longitudeNum)) ? longitudeNum : undefined,
      latitude: isFinite(Number(latitudeNum)) ? latitudeNum : undefined,
      status: (form.status || "Active") === "Active" ? "Active" : "Inactive",
      filereadtemplateid:
        form.filereadtemplateid != null
          ? Number(form.filereadtemplateid)
          : undefined,
      file_url: form.ftp_host || undefined,
      start_reading_line:
        form.start_reading_line && form.start_reading_line !== ""
          ? Number(form.start_reading_line)
          : undefined,
      ftp_port:
        form.ftp_port && form.ftp_port.trim() !== ""
          ? Number(form.ftp_port)
          : undefined,
      ftp_user: form.ftp_user || undefined,
      ftp_pass: form.ftp_pass || undefined,
      default_interval: defaultInterval,
      sub_directory: form.ftp_remote_path || undefined,
      local_directory: form.local_directory || undefined,
      parameters: form.parameters.map((p) => ({
        parameterName: p.parameterName,
        unitId: Number(p.unitId),
        parameterDriverId: Number(p.parameterDriverId),
      })),
    };
  }, [form, t]);

  /* Validation
     - In CREATE: station_id not required
     - In EDIT: station_id required for fetch/update context
  */
  const isValid =
    !!form.station_name &&
    form.parameters.length > 0 &&
    (mode === "create" || !!form.station_id) &&
    form.ftp_host && // FTP Host is required
    form.ftp_port && // FTP Port is required
    form.ftp_user && // FTP User is required
    form.ftp_pass && // FTP Pass is required
    form.ftp_remote_path && // FTP Remote Path is required
    form.status && // Status is required
    form.local_directory && // Local Directory is required
    form.longitude && // Longitude is required
    form.latitude && // Latitude is required
    form.filereadtemplateid; // Template Name is required

  const validateParams = () => {
    if (form.parameters.length === 0) {
      const message = "At least one parameter is required";
      setErrorMsg(message);
      toast.error(message);
      return false;
    }
    const invalidParams = form.parameters.filter((p, index) => {
      const hasName = p.parameterName && p.parameterName.trim() !== "";
      const hasValidDriverId =
        p.parameterDriverId &&
        !Number.isNaN(p.parameterDriverId) &&
        p.parameterDriverId > 0;
      const hasValidUnitId =
        p.unitId && !Number.isNaN(p.unitId) && p.unitId > 0;
      if (!hasName || !hasValidDriverId || !hasValidUnitId) {
        console.error(`Invalid parameter at index ${index}:`, {
          name: p.parameterName,
          driverId: p.parameterDriverId,
          unitId: p.unitId,
        });
        return true;
      }
      return false;
    });
    if (invalidParams.length > 0) {
      const message = `${invalidParams.length} parameter(s) have invalid data. Please check parameter name, driver ID, and unit ID.`;
      setErrorMsg(message);
      toast.error(message);
      return false;
    }
    setErrorMsg("");
    return true;
  };

  /* Add & remove parameter rows */
  const addParam = () => {
    if (!paramSel || !unitSel) {
      toast.error("Please select both parameter and unit");
      return;
    }
    const paramObj = paramOptionsState.find((p) => String(p.id) === paramSel);
    const unitObj = unitOptionsState.find((u) => String(u.id) === unitSel);
    if (!paramObj?.name?.trim()) {
      toast.error("Invalid parameter selection");
      return;
    }
    if (!unitObj?.name?.trim()) {
      toast.error("Invalid unit selection");
      return;
    }
    const isDuplicate = form.parameters.some(
      (p) =>
        p.parameterDriverId === Number(paramObj.id) &&
        p.unitId === Number(unitObj.id)
    );
    if (isDuplicate) {
      toast.error("This parameter and unit combination already exists");
      return;
    }
    const newParam = {
      parameterName: paramObj.name,
      parameterDriverId: Number(paramObj.id),
      unitId: Number(unitObj.id),
      unitName: unitObj.name,
    };
    setForm((f) => ({ ...f, parameters: [...f.parameters, newParam] }));
    setParamSel("");
    setUnitSel("");
    toast.success(`Added parameter: ${paramObj.name} (${unitObj.name})`);
  };

  const removeParam = (idx: number) =>
    setForm((f) => ({
      ...f,
      parameters: f.parameters.filter((_, i) => i !== idx),
    }));

  /* Field handlers */
  const handleChange =
    (name: keyof SiteConfigFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [name]: e.target.value }));
    };
  const handleSelect = (name: keyof SiteConfigFormData, value: string) =>{
    console.log("name",name);
    console.log("value",value);
    setForm((f) => ({ ...f, [name]: value }));
    }

  /* Creators (API) */
  async function createParameterDriver(name: string) {
    if (!name?.trim()) {
      toast.error("Parameter name is required");
      return;
    }
    setCreatingParam(true);
    setCreateError("");
    try {
      const payload = { ParameterDriverName: name.trim() };
      const res = await api.post(`${apiBase}${PARAM_ENDPOINT}`, payload);
      const responseData = (res as any)?.data ?? res ?? {};
      const newId =
        responseData.parameterid ??
        responseData.parameterId ??
        responseData.ID ??
        responseData.id ??
        responseData.ParameterDriverID ??
        responseData.parameterDriverId ??
        responseData.data?.parameterid ??
        responseData.data?.parameterId ??
        responseData.data?.ID ??
        responseData.data?.id ??
        responseData.data?.ParameterDriverID ??
        Date.now();
      const newName =
        responseData.ParameterDriverName ??
        responseData.parameterDriverName ??
        responseData.name ??
        responseData.data?.ParameterDriverName ??
        responseData.data?.parameterDriverName ??
        responseData.data?.name ??
        name.trim();
      if (!newId || typeof newId === "number") {
        // if it's our Date.now fallback treat as error
        // eslint-disable-next-line eqeqeq
        if (newId == Date.now()) throw new Error("Invalid parameter ID");
      }
      setParamOptionsState((prev) => [...prev, { id: newId, name: newName }]);
      setParamSel(String(newId));
      setShowParamDialog(false);
      setNewParamName("");
      toast.success(`Parameter "${newName}" created successfully`);
    } catch (e: any) {
      const errorMessage = getErrorMessage(e, "Failed to create parameter");
      setCreateError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreatingParam(false);
    }
  }

  async function createUnit(name: string, description: string) {
    if (!name?.trim()) {
      toast.error("Unit name is required");
      return;
    }
    setCreatingUnit(true);
    setCreateError("");
    try {
      const payload = {
        UnitName: name.trim(),
        Description: (description ?? "").trim(),
      };
      const res = await api.post(`${apiBase}${UNITS_ENDPOINT}`, payload);
      const root = (res as any)?.data ?? res ?? {};
      const newId =
        root.unitid ??
        root.unitId ??
        root.ID ??
        root.id ??
        root.UnitID ??
        root.data?.unitid ??
        root.data?.unitId ??
        root.data?.ID ??
        root.data?.id ??
        root.data?.UnitID ??
        Date.now();
      const newName =
        root.UnitName ??
        root.unitName ??
        root.name ??
        root.data?.UnitName ??
        root.data?.unitName ??
        root.data?.name ??
        name.trim();
      if (!newId || typeof newId === "number") {
        // eslint-disable-next-line eqeqeq
        if (newId == Date.now()) throw new Error("Invalid unit ID");
      }
      setUnitOptionsState((prev) => [...prev, { id: newId, name: newName }]);
      setUnitSel(String(newId));
      setShowUnitDialog(false);
      setNewUnitName("");
      setNewUnitDescription("");
      toast.success(`Unit "${newName}" created successfully`);
    } catch (e: any) {
      const errorMessage = getErrorMessage(e, "Failed to create unit");
      setCreateError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCreatingUnit(false);
    }
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8">
      <h1 className="text-lg font-semibold mb-4">
        {mode === "create" ? t("createTitle") : t("editTitle")}
      </h1>

      {/* Server options status */}
      {optionsLoading && (
        <div className="text-xs text-muted-foreground mb-3">
          {t("loadingOptions") || "Loading options…"}
        </div>
      )}
      {!!optionsError && (
        <div className="text-xs text-red-600 mb-3">{optionsError}</div>
      )}

      {/* Station Name only (hide Station ID for both create and edit) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <InputWithLabel
          label={t("form.stationName")}
          value={form.station_name}
          onChange={handleChange("station_name")}
          placeholder={t("form.placeholderStationName")}
          required={true}
        />
      </div>

      {/* Add new parameter */}
      <div className="rounded-md border p-4 mb-4">
        <p className="text-sm font-medium mb-3">{t("addParamConfig")}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SelectInput
            label={t("parameterLabel")}
            value={paramSel}
            onValueChange={(v) => setParamSel(v)}
            options={paramOptionsState.map((p) => ({
              value: String(p.id),
              label: p.name,
            }))}
            placeholder={t("parameterLabel")}
            onAddClick={() => setShowParamDialog(true)}
            addLabel={t("addNewParameter")}
             required={true}
          />
          <SelectInput
            label={t("unitLabel")}
            value={unitSel}
            onValueChange={(v) => setUnitSel(v)}
            options={unitOptionsState.map((u) => ({
              value: String(u.id),
              label: u.name,
            }))}
            placeholder={t("unitLabel")}
            onAddClick={() => setShowUnitDialog(true)}
            addLabel={t("addNewUnit")}
             required={true}
          />
          <div className="flex items-end">
            <Button onClick={addParam} className="w-full md:w-auto">
              {t("addConfiguration")}
            </Button>
          </div>
        </div>
      </div>

      {/* Configured parameters */}
      <div className="rounded-md border p-4 mb-6">
        <p className="text-sm font-medium mb-3">{t("configuredParameters")}</p>
        {form.parameters.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("noParameters")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {form.parameters.map((p, i) => (
              <Badge
                key={`${p.parameterDriverId}-${p.unitId}-${i}`}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {p.parameterName}{" "}
                <span className="text-muted-foreground">{p.unitName}</span>
                <button
                  type="button"
                  className="ml-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => removeParam(i)}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Connection & Template */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <SelectInput
          label={t("connectionTypeLabel")}
          value={form.connection_type}
          onValueChange={(v) => handleSelect("connection_type", v)}
          options={CONNECTION_OPTIONS}
           required={true}
        />
        <SelectInput
          label={t("templateName")}
          value={
            form.filereadtemplateid != null
              ? String(form.filereadtemplateid)
              : ""
          }
          onValueChange={(v) => {
            const chosen = templateOptionsState.find((o) => String(o.id) === v);
            setForm((f) => ({
              ...f,
              filereadtemplateid: Number(v),
              template_name: chosen?.name,
            }));
          }}
          options={templateOptionsState.map((k) => ({
            value: String(k.id),
            label: k.name,
          }))}
          placeholder={
            templateOptionsState.length
              ? t("selectTemplate") || "Select Template"
              : t("noTemplates") || "No templates"
          }
           required={true}
        />
      </div>

      {/* FTP block + reader settings */}
      <div className="rounded-md border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputWithLabel
            label={t("ftpHost")}
            value={form.ftp_host || ""}
            onChange={handleChange("ftp_host")}
            placeholder="ftp://example.com/weather_data.csv"
            required={true}
          />
          <InputWithLabel
            label={t("ftpPort")}
            value={form.ftp_port || ""}
            onChange={handleChange("ftp_port")}
            placeholder="21"
             required={true}
          />
          <InputWithLabel
            label={t("ftpUser")}
            value={form.ftp_user || ""}
            onChange={handleChange("ftp_user")}
            placeholder="test_user"
             required={true}
          />
          <InputWithLabel
            label={t("ftpPass")}
            type="password"
            value={form.ftp_pass || ""}
            onChange={handleChange("ftp_pass")}
            placeholder="••••••••"
             required={true}
          />
          <InputWithLabel
            label={t("ftpRemotePath")}
            value={form.ftp_remote_path || ""}
            onChange={handleChange("ftp_remote_path")}
            placeholder="/data/weather"
             required={true}
          />
          <SelectInput
            label={t("ftpDefaultInterval")}
            value={form.ftp_default_interval || t("intervals.1h")}
            onValueChange={(v) => handleSelect("ftp_default_interval", v)}
            options={INTERVAL_OPTION_LABELS}
             required={true}
          />
          <InputWithLabel
            label={t("startReadingLine") || "Start Reading Line"}
            value={form.start_reading_line || ""}
            onChange={handleChange("start_reading_line")}
            placeholder="2"
             required={true}
          />
          <SelectInput
            label={t("serverStatus")}
            value={form.status}
            onValueChange={(v) => handleSelect("status", v)}
            options={STATUS_OPTIONS}
             required={true}
          />
          <InputWithLabel
            label={t("localDirectory")}
            value={form.local_directory || ""}
            onChange={handleChange("local_directory")}
            placeholder="/local/weather_data"
             required={true}
          />
        </div>
      </div>

      {/* Location / Meta */}
      <div className="rounded-md border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputWithLabel
            label={t("longitude")}
            value={form.longitude || ""}
            type="number"
            onChange={handleChange("longitude")}
            placeholder="55.2708"
             required={true}
          />
          <InputWithLabel
            label={t("latitude")}
            value={form.latitude || ""}
            onChange={handleChange("latitude")}
            type="number"
            placeholder="25.2048"
             required={true}
          />
          <InputWithLabel
            label={t("region")}
            value={form.region || ""}
            onChange={handleChange("region")}
            placeholder="Fujairah"
          />
          <div className="md:col-span-2">
            <Label className="text-xs block mb-1">{t("description")}</Label>
            <Textarea
              value={form.description || ""}
              onChange={handleChange("description")}
              placeholder="Main monitoring station for urban data"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        {errorMsg && (
          <div className="text-red-600 text-sm mb-2 mr-4 flex items-center">
            {errorMsg}
          </div>
        )}
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          disabled={!isValid || loading}
          onClick={async () => {
            if (mode === "edit" && !form.station_id?.trim()) {
              toast.error("Station ID is required in edit mode");
              return;
            }
            if (!form.station_name?.trim()) {
              toast.error("Station name is required");
              return;
            }
            if (!validateParams()) return;

            try {
              await Promise.resolve(onSubmit(apiPayload));
              toast.success(
                mode === "create"
                  ? "Site configuration created successfully"
                  : "Site configuration updated successfully"
              );
            } catch (error: any) {
              const msg = getErrorMessage(error, "Failed to submit form");
              console.error("Form submission error:", error);
              setErrorMsg(msg);
              toast.error(msg);
            }
          }}
        >
          {mode === "create" ? t("addSiteConfiguration") : t("saveChanges")}
        </Button>
      </div>

      {/* --- Creatable dialogs --- */}
      {showParamDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow space-y-3 w-[min(92vw,480px)]">
            <Label>{t("newParameterName")}</Label>
            <Input
              value={newParamName}
              onChange={(e) => setNewParamName(e.target.value)}
              placeholder={t("parameterLabel")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createParameterDriver(newParamName);
                }
              }}
            />
            {!!createError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {createError}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => createParameterDriver(newParamName)}
                disabled={creatingParam || !newParamName.trim()}
              >
                {creatingParam ? t("saving") : t("add")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowParamDialog(false);
                  setNewParamName("");
                  setCreateError("");
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showUnitDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow space-y-3 w-[min(92vw,480px)]">
            <Label>{t("newUnitName")}</Label>
            <Input
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder={t("unitLabel")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createUnit(newUnitName, newUnitDescription);
                }
              }}
            />
            <Label>{t("unitDescription") || "Unit Description"}</Label>
            <Textarea
              value={newUnitDescription}
              onChange={(e) => setNewUnitDescription(e.target.value)}
              placeholder="Enter unit description..."
              rows={3}
            />
            {!!createError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {createError}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => createUnit(newUnitName, newUnitDescription)}
                disabled={creatingUnit || !newUnitName.trim()}
              >
                {creatingUnit ? t("saving") : t("add")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnitDialog(false);
                  setNewUnitName("");
                  setNewUnitDescription("");
                  setCreateError("");
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Small helpers ---------- */
function InputWithLabel({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label} {required && <span className="text-red-600">*</span>}</Label>
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        type={type}
        className="border border-gray-300 focus-visible:ring-0"
        required={required}
        disabled={disabled}
        readOnly={disabled}
      />
    </div>
  );
}

type Option =
  | string
  | {
      value: string;
      label: string;
    };

/** SelectInput with inline “Add …” footer */
function SelectInput({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  onAddClick,
  addLabel,
  required = false,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: Option[] | readonly Option[];
  placeholder?: string;
  onAddClick?: () => void;
  addLabel?: string;
   required?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label} {required && <span className="text-red-600">*</span>}</Label>
      <Select
        value={value}
        onValueChange={onValueChange}
        open={open}
        onOpenChange={setOpen}
      >
        <SelectTrigger className="border border-gray-300 focus-visible:ring-0">
          <SelectValue placeholder={placeholder || `Select ${label}`} />
        </SelectTrigger>
        <SelectContent className="p-0">
          <div className="max-h-60 overflow-y-auto">
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
          </div>
          {onAddClick && (
            <div className="border-t p-1 sticky bottom-0 bg-background">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted rounded-md"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  onAddClick();
                }}
              >
                <Plus className="w-4 h-4" />
                {addLabel || `Add ${label}`}
              </button>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
