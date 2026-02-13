// types/react-color.d.ts
declare module "react-color" {
  import * as React from "react";
  export const ChromePicker: React.ComponentType<{
    color: string;
    onChange: (color: { hex: string }) => void;
  }>;
}
