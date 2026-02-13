import { useQuery } from "@tanstack/react-query";
import { getThresholds } from "@/services/useThreshold";
import { Threshold } from "@/types/threshold";

export function useThresholds() {
  return useQuery<Threshold[]>({
    queryKey: ["thresholds"],
    queryFn: getThresholds,
  });
}
