export interface UserInfo {
  refetch(): unknown;
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  phone_no: string;
  emirates_id: string;
  role_id: number;
  status: string;
  organization: string;
  created_at: string;
  updated_at: string;
  profile_picture: string | null;
}

export interface FtpConfigApi {
  id: string;
  file_url: string;
  start_reading_line: number;
  site_id: string;
  ftp_port: number;
  ftp_user: string;
  ftp_pass: string;
  default_interval: number;
  sub_directory: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface sessionInfo {
  user: {
    name: string;
    email: string;
  };
}

// src/types/widget.ts
export type WidgetConfig = {
  selectedcolor: any;
  id: string;
  attributeName: string;
  enable: boolean;
  title: string;
  ParameterID: number;
  colors: string[]; // 🔵 Add this
  value: number;
  minValue: number;
  maxValue: number;
  type: number;
  enableGradient: boolean;
  interval: number | null;
  chartType: number;
  chartColor: string;
  chartEnable: boolean;
  insights: any[]; // (Adjust type later if needed)
  chartInterval: number | null;
};

export interface UserResponse {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone_no: number;
  emirates_id: string;
  uuid: string;
  role_id: number;
  status: string;
  organization: string;
  created_at: string;
  updated_at: string;
  profile_picture: string | null;
}
export interface UserData {
  id?: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  emirates_id: string;
  uuid: string;
  phone_no: string;
  role: string;
  organization: string;
  status: "active" | "inactive";
  createdAt?: string;
}
