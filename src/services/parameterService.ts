// src/services/parameterService.ts
import api from "@/app/api/api";

export interface Parameter {
  ParameterID: number;
  ParameterName: string;
  UnitID: number;
  UnitName: string;
  SiteID: string;
  SiteName: string;
  ParameterDriverID: number;
  ParameterDriverName: string;
}

export const ParameterService = {
  getStationParameters: async (stationId: number | string) => {
    const response = await api.get<Parameter[]>(`/Parameterslist/${stationId}`);
    return response.data;
  },
  getAllParameter: async () => {
    const response = await api.get<Parameter[]>("/Parameterslist");
    return response.data;
  },
};
