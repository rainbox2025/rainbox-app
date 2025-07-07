import axios from "axios";
import { config } from "@/config";
import { useAuth } from "@/context/authContext";
import { useMemo } from "react";

export const useAxios = () => {
  const { accessToken } = useAuth();

  const api = useMemo(() => {
    const axiosInstance = axios.create({
      baseURL: config.api.baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    axiosInstance.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    return axiosInstance;
  }, [accessToken]);

  return api;
};
