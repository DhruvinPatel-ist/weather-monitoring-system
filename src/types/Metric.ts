import { ReactNode } from "react";

export interface Metric {
  id: string;
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  color: string;
  gaugeValue: number;
  min: string | number;
  max: string | number;
}
