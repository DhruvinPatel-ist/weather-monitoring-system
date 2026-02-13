import { useQuery } from "@tanstack/react-query";
import { FtpService } from "@/services/userService";
import { FtpConfigApi } from "@/types/user";
import { WidgetService } from "@/services/WidgetServices";
import { WidgetConfig } from "@/types/user";

export function useFtpStations() {
  return useQuery<FtpConfigApi[]>({
    queryKey: ["ftpStations"],
    queryFn: async () => {
      const response = await FtpService.getFtpStations();
      return response.map((item) => ({
        ...item,
        default_interval: item.default_interval ?? 30, // 🛠️ if null, fix to 30
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWidgetConfig() {
  return useQuery<WidgetConfig[]>({
    queryKey: ["widgetConfig"],
    queryFn: WidgetService.getWidgetConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
