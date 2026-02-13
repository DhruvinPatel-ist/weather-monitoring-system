/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/app/api/api";

export interface EmailConfig {
  id: number;
  configurationLevel: string; // server returns this; maps to stationId
  email: string; // server returns comma-separated emails
  status: number;
}

export interface ApiResponse {
  data: EmailConfig[];
  count: number;
}

// >>> New payload type you want to send <<<
export interface CreateUpdateEmailConfigPayload {
  stationId: number;
  emailIds: string[];
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";

// If your backend uses different paths, change this:
const ENDPOINT = `${BASE_URL}/email-configurations`;

/* ---------- Service ---------- */
export const EmailConfigService = {
  async getEmailConfigs(): Promise<EmailConfig[]> {
    const response = await api.get<ApiResponse>(ENDPOINT);
    return response.data.data;
  },

  // Send { stationId, emailIds } directly as JSON
  async createEmailConfig(
    payload: CreateUpdateEmailConfigPayload
  ): Promise<EmailConfig> {
    const response = await api.post<EmailConfig>(ENDPOINT, payload);
    return response.data;
  },

  // PUT { stationId, emailIds } directly as JSON
  async updateEmailConfig(
    id: string,
    payload: CreateUpdateEmailConfigPayload
  ): Promise<EmailConfig> {
    if (!id) throw new Error("Missing id");
    const response = await api.put<EmailConfig>(
      `${ENDPOINT}/${encodeURIComponent(id)}`,
      payload
    );
    return response.data;
  },

  async deleteEmailConfig(id: string): Promise<void> {
    if (!id) throw new Error("Missing id");
    await api.delete<void>(`${ENDPOINT}/${encodeURIComponent(id)}`);
  },
};
