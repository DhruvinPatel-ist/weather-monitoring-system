import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchGeneralSettings,
  updateGeneralSettings,
  getAllGeneralSettings,
} from "@/services/generalSettingsService";
import { GeneralSettingsResponse } from "@/types/generalSettingsTypes";

// Hook: Fetch General Settings for a site
export function useGeneralSettings(siteId: string | null) {
  return useQuery({
    queryKey: ["general-settings", siteId],
    queryFn: () => {
      if (!siteId) throw new Error("Site ID is required");
      return fetchGeneralSettings(siteId);
    },
    enabled: !!siteId,
  });
}

// Hook: Fetch All General Settings
export function useAllGeneralSettings() {
  return useQuery({
    queryKey: ["general-settings-all"],
    queryFn: getAllGeneralSettings,
  });
}

// Hook: Update General Settings
export function useUpdateGeneralSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<GeneralSettingsResponse, "id">>;
    }) => updateGeneralSettings(id, payload),

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["general-settings", data.site_id],
      });
    },
  });
}
