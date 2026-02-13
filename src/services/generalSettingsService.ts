// services/generalSettingsService.ts

import api from "@/app/api/api";
import { GeneralSettingsResponse } from "@/types/generalSettingsTypes";

// GET: /general-settings/:siteId
export const fetchGeneralSettings = async (siteId: string) => {
  const { data } = await api.get<GeneralSettingsResponse>(
    `/general-settings/${siteId}`
  );
  return data;
};

// PUT: /general-settings/:id
export const updateGeneralSettings = async (
  id: string,
  payload: Partial<
    Omit<GeneralSettingsResponse, "id" | "created_at" | "updated_at">
  >
) => {
  const { data } = await api.put<GeneralSettingsResponse>(
    `/general-settings/${id}`,
    payload
  );
  return data;
};

export const getAllGeneralSettings = async () => {
  const { data } = await api.get<GeneralSettingsResponse[]>(
    `/general-settings`
  );
  return data;
};
