// services/alert-service.ts
import api from "@/app/api/api";

export const AlertService = {
  async getAlerts(timeframe: string, dateTimeRange: string) {
    const response = await api.get(`/alerts/${timeframe}/${dateTimeRange}`);
    return response.data;
  },
};

export const AlertServiceByInterval = {
  async getAlertsByInterval(value: string) {
    const response = await api.get(`/reportalertsinterval/${value}`);
    return response.data;
  },
};

// services/DeleteAlertService.ts
export const DeleteAlertService = {
  async deleteAlert(alertId: string) {
    const response = await api.delete(`/alerts/${alertId}`);
    return response.data;
  },
};
