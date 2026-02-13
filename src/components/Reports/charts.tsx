"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
} from "recharts";

interface ChartProps {
  data?: { time: string; fullTime?: string; value: number }[];
  label: string;
  color: string;
  flat?: boolean;
}

export function LineChart({ data, label, color, flat }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
      >
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          angle={-45}
          dy={10}
          interval={data && data.length > 20 ? Math.floor(data.length / 8) : 0} // Show fewer ticks for large datasets
        />
        <YAxis
          tick={{ fontSize: 10 }}
          domain={flat ? [0, 1] : ["auto", "auto"]}
        />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip
          formatter={(value: number) => `${value}`}
          labelFormatter={(label: string, payload: any[]) =>
            payload[0]?.payload?.fullTime || label
          }
        />

        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          dot={false}
          name={label}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export function AreaChart({ data, label, color }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          angle={-45}
          dy={10}
          interval={data && data.length > 20 ? Math.floor(data.length / 8) : 0}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={color}
          name={label}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLineChart({
  series,
}: {
  series: {
    siteName: string;
    data: { time: string; value: number }[];
  }[];
}) {
  const mergedData: Record<string, any>[] = [];

  // Collect all time labels and merge by timestamp
  series.forEach(({ siteName, data }) => {
    data.forEach((point, i) => {
      if (!mergedData[i]) mergedData[i] = { time: point.time };
      mergedData[i][siteName] = point.value;
    });
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={mergedData}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10 }}
          angle={-45}
          dy={10}
          interval={mergedData.length > 20 ? Math.floor(mergedData.length / 8) : 0}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        {series.map(({ siteName }, index) => (
          <Line
            key={siteName}
            type="monotone"
            dataKey={siteName}
            stroke={`hsl(${(index * 67) % 360}, 70%, 50%)`}
            dot={false}
            name={siteName}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
