import api from "@/app/api/api";

export interface SiteConfigResponse {
  success: boolean;
  message: string;
  data: SiteConfig[];
  count: number;
}

export interface SiteConfig {
  siteId: string;
  siteName: string;
  longitude: number;
  latitude: number;
  siteStatus: string;
  siteCreatedAt: string;
  ftpConfigId: string;
  file_url: string;
  ftp_port: number;
  ftp_user: string;
  ftpStatus: string;
  ftpCreatedAt: string;
  parameters: Parameter[];
  parameterCount: number;
  parameterDisplayText: string;
  unitDisplayText: string;
}

export interface Parameter {
  parameterId: number;
  ParameterName: string;
  ParameterValue: any;
  ParameterReadingUpdateTime: any;
  parameterCreatedAt: any;
  parameterStatus: any;
  parameterDriverId: number;
  ParameterDriverName: string;
  unitId: number;
  UnitName: string;
  unitDescription: string;
}

export const SiteService = {
  async geAlltSiteConfigs(): Promise<SiteConfigResponse> {
    const res = await api.get("/site-configurations");
    if (res.status < 200 || res.status >= 300)
      throw new Error("Failed to fetch site configs");
    return res.data as SiteConfigResponse;
  },

  async createSiteConfig(payload: any) {
    const res = await api.post("/site-configuration", payload);
    if (res.status < 200 || res.status >= 300)
      throw new Error("Failed to create site config");
    return res.data;
  },
  async getSiteConfig(id: string): Promise<SiteConfigResponse> {
    const res = await api.get(`/site-configuration/${id}`);
    if (res.status < 200 || res.status >= 300)
      throw new Error("Failed to fetch site config");
    return res.data as SiteConfigResponse;
  },

  async updateSiteConfig(id: string, payload: any) {
    const res = await api.put(`/site-configuration/${id}`, payload);
    if (res.status < 200 || res.status >= 300)
      throw new Error("Failed to update site config");
    return res.data;
  },

  async deleteSiteConfig(id: string) {
    const res = await api.delete(`/site-configuration/${id}`);
    if (res.status < 200 || res.status >= 300)
      throw new Error("Failed to delete site config");
    return res.data;
  },

  async createParameterDriver(payload: any) {
    const res = await api.post("/parameter-drivers", payload);
    if (res.status < 200 || res.status >= 300)
      throw new Error("Failed to create parameter driver");
    return res.data;
  },
};
