import api from "@/app/api/api";
import { Station } from "@/components/Dashboard/view/parameter-view";
import { UserInfo, FtpConfigApi } from "@/types/user";

export const AccountService = {
  getStations: async (): Promise<Station[]> => {
    const response = await api.get("/sites");
    return response.data;
  },
};

export const UserService = {
  getUserInfo: async (userId: string): Promise<UserInfo> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  updateUserInfo: async (
    userId: string,
    updatedData: Partial<UserInfo>
  ): Promise<any> => {
    const response = await api.put(`/users/${userId}`, updatedData);
    return response.data;
  },
};

export const FtpService = {
  getFtpStations: async (): Promise<FtpConfigApi[]> => {
    const response = await api.get("/ftpconfigs");
    return response.data;
  },

  getFtpStationById: async (id: string): Promise<FtpConfigApi> => {
    const response = await api.get(`/ftpconfig/${id}`);
    return response.data;
  },

  createFtpStation: async (
    data: Omit<FtpConfigApi, "id" | "created_at" | "updated_at">
  ) => {
    const response = await api.post("/ftpconfig", data);
    return response.data;
  },

  updateFtpStation: async (id: string, data: Partial<FtpConfigApi>) => {
    const response = await api.put(`/ftpconfig/${id}`, data);
    return response.data;
  },

  deleteFtpStation: async (id: string) => {
    const response = await api.delete(`/ftpconfig/${id}`);
    return response.data;
  },
};

export const userActivityService = {
  getUserActivity: async (): Promise<any> => {
    const response = await api.get(`/all-activity-logs`);
    return response.data;
  },
};
