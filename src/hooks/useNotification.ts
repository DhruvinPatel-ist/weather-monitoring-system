import { useQuery } from "@tanstack/react-query";
import api from "@/app/api/api";

export const useGetNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notification");
      return response.data;
    },
  });
};
