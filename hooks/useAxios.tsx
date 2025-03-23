import axios from "axios";
import { config } from "@/config";
import { useAuth } from "@/context/authContext";
export const useAxios = () => {
  const { accessToken } = useAuth();
  const api = axios.create({
    baseURL: config.api.baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });
  api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  });

  return api;
};
