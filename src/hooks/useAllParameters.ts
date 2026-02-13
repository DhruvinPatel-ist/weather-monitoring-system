// src/hooks/useAllParameters.ts
import { ParameterService } from "@/services/parameterService";
import { useState } from "react";

export function useAllParameters() {
  const [parameterMap, setParameterMap] = useState<Record<string, string>>({});
  const [loadingStations, setLoadingStations] = useState<
    Record<string, boolean>
  >({});

  const fetchParametersForStation = async (stationId: string | number) => {
    try {
      setLoadingStations((prev) => ({ ...prev, [stationId]: true }));
      const parameters = await ParameterService.getStationParameters(stationId);

      // Map the parameters to their names
      const paramMap: Record<string, string> = {};
      parameters.forEach((param) => {
        if (param.ParameterID && param.ParameterName) {
          paramMap[param.ParameterID.toString()] = param.ParameterName;
        }
      });

      setParameterMap((prev) => ({ ...prev, ...paramMap }));
      return paramMap;
    } catch (error) {
      console.error(
        `Failed to fetch parameters for station ${stationId}:`,
        error
      );
      return {};
    } finally {
      setLoadingStations((prev) => ({ ...prev, [stationId]: false }));
    }
  };

  // Function to get parameter name by ID
  const getParameterName = (
    parameterId: string | number | undefined,
    stationId?: string | number
  ): string => {
    if (!parameterId) return "-";

    const paramId = parameterId.toString();

    // If we already have the parameter name, return it
    if (parameterMap[paramId]) {
      return parameterMap[paramId];
    }

    // If we have a station ID and we're not already loading parameters for it,
    // fetch parameters for this station
    if (stationId && !loadingStations[stationId]) {
      fetchParametersForStation(stationId);
    }

    // Return the ID as fallback while loading
    return `Parameter ${paramId}`;
  };

  return {
    parameterMap,
    getParameterName,
    fetchParametersForStation,
    isLoading: Object.values(loadingStations).some(Boolean),
  };
}
