import axios from "axios";
import { config } from "@/config";
import { useAuth } from "@/context/authContext";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
export const useAxios = () => {
  const supabase = createClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  useEffect(() => {
    const fetchAccessToken = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;
      setAccessToken(session.session.access_token);
    };
    fetchAccessToken();
  }, []);
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
