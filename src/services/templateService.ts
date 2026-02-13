/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/app/api/api";

/* ---------- Backend API Types ---------- */
export interface ApiTemplateMetadata {
  ColumnNumber: number;
  DataFieldID: number;
  ParameterDriverID: number | null;
  DateFormat: string | null;
}

export interface ApiTemplate {
  ID: number;
  TemplateName: string;
  NumberOfHeaderRows: number;
  NumberOfFooterRows: number;
  FieldDelimiter: string;
  CreatedBy: string | null;
  CreatedAt: string | null;
  Metadata?: ApiTemplateMetadata[];
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  count: number;
}

export type ApiCreateOrUpdateTemplate = {
  TemplateName: string;
  NumberOfHeaderRows: number;
  NumberOfFooterRows: number;
  FieldDelimiter: string; // "Comma" | "Tab" | "Semicolon" | "Pipe" | "Whitespace"
  Metadata: Array<{
    DataFieldID: number;
    ParameterDriverID: number | null;
    ColumnNumber: number;
    DateFormat: string | null;
  }>;
};

/* ---------- Frontend Form Types (what the UI works with) ---------- */
export type TemplateFormValues = {
  id?: string | number;
  templateName: string;
  headerRows: number;
  footerRows: number;
  fieldDelimiter: string; // same options as above
  metadata: Array<{
    columnNumber: number;
    dataFieldId: number;
    parameterDriverId: number | null;
    dateFormat: string | null;
  }>;
};

export type DataFieldValue = {
  ID: number;
  DataField: string;
};

export type ParameterDriverValue = {
  ID: number;
  ParameterDriverName: string;
};

/* ---------- Helpers ---------- */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";
const ENDPOINT = `${BASE_URL}/templates`;

/** Map FE form values -> BE payload */
function toApiPayload(values: TemplateFormValues): ApiCreateOrUpdateTemplate {
  return {
    TemplateName: values.templateName.trim(),
    NumberOfHeaderRows: Number(values.headerRows || 0),
    NumberOfFooterRows: Number(values.footerRows || 0),
    FieldDelimiter: values.fieldDelimiter, // keep as-is ("Comma" | "Whitespace" | etc.)
    Metadata: values.metadata.map((m, i) => ({
      DataFieldID: Number(m.dataFieldId),
      ParameterDriverID:
        m.parameterDriverId === null || m.parameterDriverId === undefined
          ? null
          : Number(m.parameterDriverId),
      ColumnNumber: Number(m.columnNumber || i + 1),
      DateFormat: m.dateFormat ? String(m.dateFormat) : null,
    })),
  };
}

/* ---------- Service ---------- */
export const TemplateService = {
  async getTemplates(): Promise<ApiTemplate[]> {
    const res = await api.get<ApiListResponse<ApiTemplate>>(ENDPOINT);
    // API: { success, message, data: [...], count }
    return res.data.data ?? [];
  },
  async getTemplate(id: string | number): Promise<ApiTemplate | null> {
    if (!id) throw new Error("Missing id");
    const res = await api.get<{
      success: boolean;
      message: string;
      data: ApiTemplate;
    }>(`${ENDPOINT}/${encodeURIComponent(String(id))}`);
    return res.data?.data ?? null;
  },
  async createTemplate(values: TemplateFormValues): Promise<ApiTemplate> {
    const payload = toApiPayload(values);
    const res = await api.post<ApiTemplate>(ENDPOINT, payload);
    return res.data;
  },

  async updateTemplate(
    id: string | number,
    values: TemplateFormValues
  ): Promise<ApiTemplate> {
    if (!id) throw new Error("Missing id");
    const payload = toApiPayload(values);
    const res = await api.put<ApiTemplate>(
      `${ENDPOINT}/${encodeURIComponent(String(id))}`,
      payload
    );
    return res.data;
  },

  async deleteTemplate(id: string | number): Promise<void> {
    if (!id) throw new Error("Missing id");
    await api.delete(`${ENDPOINT}/${encodeURIComponent(String(id))}`);
  },

  async getDataFields(): Promise<DataFieldValue[]> {
    const res = await api.get<ApiListResponse<DataFieldValue>>(`/data-fields`);
    return res.data.data ?? [];
  },

  async getParameterDrivers(): Promise<ParameterDriverValue[]> {
    const res = await api.get<ApiListResponse<ParameterDriverValue>>(
      `/parameter-drivers`
    );
    return res.data.data ?? [];
  },
};
