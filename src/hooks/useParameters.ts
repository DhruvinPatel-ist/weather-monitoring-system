// src/hooks/useParameters.ts
import { useQuery } from "@tanstack/react-query";
import { ParameterService, Parameter } from "@/services/parameterService";

export function useStationParameters(
  stationId: number | string | undefined | null
) {
  return useQuery<Parameter[]>({
    queryKey: ["stationParameters", stationId],
    queryFn: () =>
      stationId
        ? ParameterService.getStationParameters(stationId)
        : Promise.resolve([]),
    enabled: !!stationId, // Only fetch when we have a valid stationId
  });
}
