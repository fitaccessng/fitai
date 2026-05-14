import api from "./api";

export const registerUser = async (payload) => {
  const { data } = await api.post("/register", payload);
  return data;
};

export const loginUser = async (payload) => {
  const { data } = await api.post("/login", payload);
  return data;
};

export const requestPasswordReset = async (payload) => {
  const { data } = await api.post("/forgot-password", payload);
  return data;
};

export const resetPassword = async (payload) => {
  const { data } = await api.post("/reset-password", payload);
  return data;
};
