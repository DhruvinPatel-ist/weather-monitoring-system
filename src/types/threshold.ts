import { ReactNode } from "react";

export interface Threshold {
  timeInterval: ReactNode;
  threshold_name: ReactNode;
  id?: string;
  ID?: string;
  attribute_id?: string;
  ParameterID?: string;
  minValue?: number;
  maxValue?: number;
  Value?: number;
  CreatedAt: string;
  UpdatedAt?: string;
  Comparator?: string;
  SiteID?: string | number;
}

export interface ThresholdRequest {
  timeInterval: number | string;
  threshold_name: string | number | readonly string[] | undefined;
  attribute_id?: number | string; // For backward compatibility
  ParameterID?: string | number; // API naming convention
  minValue?: number;
  maxValue?: number;
  Value?: number; // API naming convention
  Comparator?: string; // API naming convention
  SiteID?: string | number | null; // API naming convention
  siteId?: string | number; // For backward compatibility
  value?: number; // For backward compatibility
  comparator?: string; // For backward compatibility
}
