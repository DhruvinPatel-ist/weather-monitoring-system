"use client";

import * as React from "react";
import {
  Area as RechartsArea,
  AreaChart as RechartsAreaChart,
  Bar as RechartsBar,
  BarChart as RechartsBarChart,
  CartesianGrid as RechartsCartesianGrid,
  ComposedChart as RechartsComposedChart,
  Legend as RechartsLegend,
  Line as RechartsLine,
  LineChart as RechartsLineChart,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
  PolarAngleAxis as RechartsPolarAngleAxis,
  PolarGrid as RechartsPolarGrid,
  PolarRadiusAxis as RechartsPolarRadiusAxis,
  Radar as RechartsRadar,
  RadarChart as RechartsRadarChart,
  RadialBar as RechartsRadialBar,
  RadialBarChart as RechartsRadialBarChart,
  Rectangle,
  ReferenceLine as RechartsReferenceLine,
  Scatter as RechartsScatter,
  ScatterChart as RechartsScatterChart,
  Tooltip as RechartsTooltip,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  ResponsiveContainer,
} from "recharts";

import { cn } from "@/lib/utils";

// Types
type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: ChartConfig;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  indicator?: "dot" | "line";
  className?: string;
}

// Chart Container
const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    // Create CSS variables for each color in the config
    const style = React.useMemo(() => {
      if (!config) return {};

      return Object.entries(config).reduce((acc, [key, value]) => {
        acc[`--color-${key}`] = value.color;
        return acc;
      }, {} as Record<string, string>);
    }, [config]);

    return (
      <div
        ref={ref}
        className={cn("h-full w-full", className)}
        style={style}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    );
  }
);
ChartContainer.displayName = "ChartContainer";

// Chart Tooltip
const ChartTooltip = (props: React.ComponentProps<typeof RechartsTooltip>) => (
  <RechartsTooltip {...props} />
);
ChartTooltip.displayName = "ChartTooltip";

// Chart Tooltip Content
const ChartTooltipContent: React.FC<ChartTooltipContentProps> = ({
  active,
  payload,
  label,
  indicator = "dot",
  className,
  ...props
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn("rounded-lg border bg-background p-2 shadow-md", className)}
      {...props}
    >
      <div className="grid gap-0.5">
        <div className="text-xs font-medium">{label}</div>
        <div className="grid gap-1">
          {payload.map((item: any, index: number) => {
            const color = item.color || item.stroke || "#888";
            const name = item.name || item.dataKey || "";
            const value = item.value || 0;
            const formattedValue =
              typeof value === "number" ? value.toLocaleString() : value;

            return (
              <div key={index} className="flex items-center gap-1 text-xs">
                {indicator === "dot" ? (
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ) : (
                  <div
                    className="h-2.5 w-0.5"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="text-muted-foreground">{name}:</span>
                <span className="font-medium">{formattedValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
ChartTooltipContent.displayName = "ChartTooltipContent";

// Direct re-exports of Recharts components
export {
  RechartsArea as Area,
  RechartsAreaChart as AreaChart,
  RechartsBar as Bar,
  RechartsBarChart as BarChart,
  RechartsCartesianGrid as CartesianGrid,
  RechartsComposedChart as ComposedChart,
  RechartsLegend as Legend,
  RechartsLine as Line,
  RechartsLineChart as LineChart,
  RechartsPie as Pie,
  RechartsPieChart as PieChart,
  RechartsPolarAngleAxis as PolarAngleAxis,
  RechartsPolarGrid as PolarGrid,
  RechartsPolarRadiusAxis as PolarRadiusAxis,
  RechartsRadar as Radar,
  RechartsRadarChart as RadarChart,
  RechartsRadialBar as RadialBar,
  RechartsRadialBarChart as RadialBarChart,
  Rectangle,
  RechartsReferenceLine as ReferenceLine,
  RechartsScatter as Scatter,
  RechartsScatterChart as ScatterChart,
  RechartsXAxis as XAxis,
  RechartsYAxis as YAxis,
};

// Export our custom components
export { ChartContainer, ChartTooltip, ChartTooltipContent };
