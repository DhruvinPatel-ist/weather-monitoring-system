// hooks/useAlerts.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertService,
  AlertServiceByInterval,
  DeleteAlertService,
} from "@/services/useAlerts";

export function useAlerts(timeframe: string, dateTimeRange: string) {
  return useQuery({
    queryKey: ["alerts", timeframe, dateTimeRange],
    queryFn: () => AlertService.getAlerts(timeframe, dateTimeRange),
  });
}

export function useAlertsByInterval(value: string) {
  return useQuery({
    queryKey: ["alerts", value],
    queryFn: () => AlertServiceByInterval.getAlertsByInterval(value),
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => DeleteAlertService.deleteAlert(alertId),
    onSuccess: () => {
      // Optional: automatically refetch the alerts list
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
