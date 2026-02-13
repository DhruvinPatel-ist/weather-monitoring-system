import api from "@/app/api/api";
import { WidgetConfig } from "@/types/user";

export const WidgetService = {
  getWidgetConfig: async (): Promise<WidgetConfig[]> => {
    const response = await api.get("/attribute-settings");
    return response.data;
  },

  getWidgetConfigbyId: async (id: string): Promise<WidgetConfig> => {
    const response = await api.get(`/attribute-settings/${id}`);
    return response.data;
  },

  updateWidgetConfig: async (
    id: string,
    data: Partial<WidgetConfig>
  ): Promise<WidgetConfig> => {
    const response = await api.put(`/attribute-settings/${id}`, data);
    return response.data;
  },

  getAllWidgetsConfig: async (id: number | string): Promise<WidgetConfig[]> => {
    const response = await api.get(`/all-attribute-settings/${id}`);
    return response.data;
  },
};
