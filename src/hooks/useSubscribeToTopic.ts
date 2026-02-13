import { useMutation } from "@tanstack/react-query";
import NotificationService from "@/services/NotificationService";

export function useSubscribeToTopic() {
  return useMutation({
    mutationFn: NotificationService.subscribeToTopic,
  });
}
