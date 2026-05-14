import api from "./api";

export const getDashboard = async () => (await api.get("/dashboard")).data;
export const generateMealPlan = async () => (await api.post("/generate-meal-plan", { refresh: true })).data;
export const getMealPlan = async () => (await api.get("/meal-plan")).data;
export const generateWorkout = async () => (await api.post("/generate-workout", { refresh: true })).data;
export const getWorkout = async () => (await api.get("/workout")).data;
export const createLog = async (payload) => (await api.post("/log", payload)).data;
export const getLogs = async () => (await api.get("/logs")).data;

