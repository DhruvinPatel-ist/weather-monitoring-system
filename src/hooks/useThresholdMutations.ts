import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createThreshold,
  updateThreshold,
  deleteThreshold,
} from "@/services/useThreshold";
import { ThresholdRequest } from "@/types/threshold";
import { toast } from "sonner";

export function useThresholdMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: ThresholdRequest) => createThreshold(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thresholds"] });
      toast.success("Threshold created");
    },
    onError: () => toast.error("Create failed"),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ThresholdRequest }) =>
      updateThreshold(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thresholds"] });
      toast.success("Threshold updated");
    },
    onError: () => toast.error("Update failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteThreshold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thresholds"] });
      toast.success("Threshold deleted");
    },
    onError: () => toast.error("Delete failed"),
  });

  return { create, update, remove };
}
