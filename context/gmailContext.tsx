// src/contexts/GmailContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAxios } from "@/hooks/useAxios";

// --- Types ---
type GmailContextType = {
  isConnected: boolean;
  email: string | null;
  isLoading: boolean;
  error: string | null;
  connectGmail: () => Promise<void>;
  disconnectGmail: () => Promise<void>;
};

// --- Context Definition ---
const GmailContext = createContext<GmailContextType>({
  isConnected: false,
  email: null,
  isLoading: true,
  error: null,
  connectGmail: async () => { },
  disconnectGmail: async () => { },
});

// --- Provider Component ---
export const GmailProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const api = useAxios();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- Check Connection Status on Initial Load ---
  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This is a new endpoint you will need to create. See explanation below.
      const { data } = await api.get<{ isConnected: boolean; email: string | null }>("/gmail/status");
      setIsConnected(data.isConnected);
      setEmail(data.email);
    } catch (err) {
      // If the status check fails (e.g., 401 Unauthorized), assume not connected.
      setIsConnected(false);
      setEmail(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const gmailConnected = searchParams.get("gmail_connected");
    const connectedEmail = searchParams.get("email");

    if (gmailConnected === "true" && connectedEmail) {
      // User has just returned from the OAuth flow.
      setIsConnected(true);
      setEmail(connectedEmail);
      setIsLoading(false);

      // Clean the URL by removing the query parameters.
      router.replace(pathname, { scroll: false });
    } else {
      // Standard page load, check status with the backend.
      checkConnectionStatus();
    }
  }, [searchParams, pathname, router, checkConnectionStatus]);

  // --- Connect to Gmail ---
  const connectGmail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ url: string }>("/gmail/consent");
      if (data.url) {
        // Redirect the user to the Google consent screen.
        window.location.href = data.url;
      } else {
        throw new Error("Could not retrieve authentication URL.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start Gmail connection.");
      setIsLoading(false);
    }
  };

  // --- Disconnect from Gmail ---
  const disconnectGmail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This is a new endpoint you will need to create. See explanation below.
      await api.post("/gmail/disconnect");
      setIsConnected(false);
      setEmail(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to disconnect Gmail.");
    } finally {
      setIsLoading(false);
    }
  };

  // Note: The refresh token logic is handled automatically by your backend's
  // /gmail/consent/refresh endpoint. Your `useAxios` hook should ideally
  // have an interceptor that calls this endpoint when an API request fails with a 401 error.
  // The context itself doesn't need to call the refresh endpoint directly.

  const value = {
    isConnected,
    email,
    isLoading,
    error,
    connectGmail,
    disconnectGmail,
  };

  return (
    <GmailContext.Provider value={value}>
      {children}
    </GmailContext.Provider>
  );
};

// --- Custom Hook ---
export const useGmail = () => {
  const context = useContext(GmailContext);
  if (context === undefined) {
    throw new Error("useGmail must be used within a GmailProvider");
  }
  return context;
};