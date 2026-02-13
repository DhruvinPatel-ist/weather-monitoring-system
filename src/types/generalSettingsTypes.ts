// types/generalSettingsTypes.ts

export interface GeneralSettingsResponse {
  id: string;
  site_id: string;
  color: string;
  pin_style: "Pin" | "Name";
  icon_type: number;
  scale_data: number;
  direction: number;
  created_at: string;
  updated_at: string;
  display_name?: string | null;
}
