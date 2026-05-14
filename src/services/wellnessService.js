import api from "./api";

export const getWellness = async () => (await api.get("/wellness")).data;
export const updateWellness = async (payload) => (await api.put("/wellness", payload)).data;
export const generateDailyMeals = async () => (await api.post("/wellness/generate-meals", { refresh: true })).data;
export const generateGuidedWorkout = async () => (await api.post("/wellness/generate-workout", { refresh: true })).data;
