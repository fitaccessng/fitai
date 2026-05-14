import api from "./api";

export const getNotifications = async () => (await api.get("/notifications")).data;
export const markNotificationRead = async (notificationId) => (await api.post(`/notifications/${notificationId}/read`)).data;
export const sendTestNotification = async () => (await api.post("/notifications/test")).data;
