import api from "@/app/api/api";
import {
  TemperatureIcon,
  HumidityIcon,
  WindSpeedIcon,
  WindDirectionIcon,
  RainIcon,
  BarometricPressureIcon,
  SolarRadiationIcon,
  SradCumulativeIcon,
  // TestUtIcon,
} from "@/icons/dashboard/weather-icons";

// Utility to format numbers to 2 decimal places or fallback to "-"
function format(value: number | null | undefined): string {
  return value !== null && value !== undefined ? value.toFixed(2) : "-";
}

// Utility to safely convert to number for gaugeValue, fallback to 0
function safeNumber(value: number | null | undefined): number {
  return value !== null && value !== undefined ? value : 0;
}

export const frcloggerService = {
  async getMegetfrclogger(siteId: string, timeframe: string, dateTimeRange?: string) {
    const url = dateTimeRange 
      ? `/frclogger/${siteId}/${timeframe}/${dateTimeRange}`
      : `/frclogger/${siteId}/${timeframe}`;
    const response = await api.get(url);
    const data = response.data;
    // console.log(data);
    return data;
  },
};

// Default icon mapping by parameter type ID
const DEFAULT_ICON_MAP: Record<number, React.ReactNode> = {
  1: WindSpeedIcon({ className: "h-5 w-5" }),
  2: WindDirectionIcon({ className: "h-5 w-5" }),
  3: TemperatureIcon({ className: "h-5 w-5" }),
  4: HumidityIcon({ className: "h-5 w-5" }),
  5: RainIcon({ className: "h-5 w-5" }),
  6: SolarRadiationIcon({ className: "h-5 w-5" }),
  7: SradCumulativeIcon({ className: "h-5 w-5" }),
  8: BarometricPressureIcon({ className: "h-5 w-5" }),
};

// Default color scheme mapping by parameter type ID
const DEFAULT_COLOR_MAP: Record<number, string> = {
  1: "from-green-300 to-green-500", // Wind Speed
  2: "from-yellow-300 to-yellow-500", // Wind Direction
  3: "from-yellow-500 to-red-500", // Temperature
  4: "from-blue-300 to-blue-500", // Humidity
  5: "from-blue-300 to-blue-500", // Rain
  6: "from-yellow-300 to-red-500", // Solar Radiation
  7: "from-orange-300 to-red-500", // SRAD Cumulative
  8: "from-purple-300 to-purple-500", // Barometric Pressure
};

// Default ID mapping for backward compatibility
const DEFAULT_ID_MAP: Record<number, string> = {
  1: "windSpeed",
  2: "windDirection",
  3: "temperature",
  4: "humidity",
  5: "rain",
  6: "solarRadiation",
  7: "sradCumulative",
  8: "barometricPressure",
};

// Cache for widget configurations to avoid repeated fetching
let widgetConfigCache: Record<string, any[]> = {};

export const MetricService = {
  clearCache() {
    widgetConfigCache = {};
  },

  async getWidgetConfigs(siteId: string) {
    if (!widgetConfigCache[siteId]) {
      try {
        const configResponse = await api.get(
          `/all-attribute-settings/${siteId}`
        );
        widgetConfigCache[siteId] = configResponse.data || [];
      } catch (configError) {
        console.error("Error fetching widget configurations:", configError);
        widgetConfigCache[siteId] = [];
      }
    }
    return widgetConfigCache[siteId];
  },

  async getMetrics(siteId: string, timeframe: string, dateTimeRange: string) {
    try {
      // Get widget configurations for this site
      const widgetConfigs = await this.getWidgetConfigs(siteId);

      // Create a map of ParameterID to widget config for quick lookup
      // const widgetConfigMap = widgetConfigs.reduce((acc, config) => {
      //   acc[config.ParameterID] = config;
      //   return acc;
      // }, {} as Record<number, any>);

      // Fetch the actual metric data
      const response = await api.get(
        `/frclogger/${siteId}/${timeframe}/${dateTimeRange}`
      );
      const data = response.data || [];

      // Create a map of ParameterID to metric data for quick lookup
      const dataMap = Array.isArray(data)
        ? data.reduce((acc, parameterData) => {
            acc[parameterData.ParameterID] = parameterData;
            return acc;
          }, {} as Record<number, any>)
        : {};

      // Always return all widgetConfigs, filling in values from data if available
      return widgetConfigs.map((widgetConfig: any) => {
        const paramId = widgetConfig.ParameterID;
        const parameterData = dataMap[paramId];

        if (!parameterData) {
          // No data for this parameter, show only name and default values
          return {
            id: DEFAULT_ID_MAP[paramId] || widgetConfig.attributeName.replace(/\s/g, "").toLowerCase(),
            title: widgetConfig.attributeName,
            value: '-',
            unit: widgetConfig.UnitName || '',
            icon: DEFAULT_ICON_MAP[paramId] || null,
            color: DEFAULT_COLOR_MAP[paramId] || 'from-blue-300 to-blue-500',
            gaugeValue: 0,
            min: '-',
            max: '-',
            ParameterID: paramId,
            widgetConfig: widgetConfig,
          };
        }

        // Data exists for this parameter
        const latestValue = parameterData.latestValue ?? null;
        const minValue = parameterData.minValue ?? null;
        const maxValue = parameterData.maxValue ?? null;

        return {
          id: DEFAULT_ID_MAP[paramId] || widgetConfig.attributeName.replace(/\s/g, "").toLowerCase(),
          title: widgetConfig.attributeName,
          value: latestValue !== null && latestValue !== undefined ? format(latestValue) : '-',
          unit: widgetConfig.UnitName || '',
          icon: DEFAULT_ICON_MAP[paramId] || null,
          color: DEFAULT_COLOR_MAP[paramId] || 'from-blue-300 to-blue-500',
          gaugeValue: latestValue !== null && latestValue !== undefined ? safeNumber(latestValue) : 0,
          min: minValue !== null && minValue !== undefined ? format(minValue) : '-',
          max: maxValue !== null && maxValue !== undefined ? format(maxValue) : '-',
          ParameterID: paramId,
          widgetConfig: widgetConfig,
        };
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      // Return empty array when API fails
      return [];
    }
  },
};

export const TableService = {
  async getTableData(siteId: string, timeframe: string, dateTimeRange: string) {
    const response = await api.get(
      `/tableviewfrclogger/${siteId}/${timeframe}/${dateTimeRange}`
    );
    const data = response.data;
    return data;
  },
};
