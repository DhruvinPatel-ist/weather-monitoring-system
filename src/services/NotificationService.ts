import api from "@/app/api/api";

interface SubscribePayload {
  token: string;
  topic: "user_channel" | "admin_channel";
}

const NotificationService = {
  getAllNotifications: async () => {
    const { data } = await api.get("/subscribe");
    return data;
  },

  subscribeToTopic: async (payload: SubscribePayload) => {
    const { data } = await api.post("/subscribe", payload);
    return data;
  },
};

export default NotificationService;


