"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAxios } from "@/hooks/useAxios";

// --- Type Definitions ---

export type Sender = {
  id?: string; // Present after being saved to our DB
  name: string;
  email: string;
  fullName: string;
};

type PageInfo = {
  hasNextPage: boolean;
  totalProcessed?: number;
  resultsPerPage?: number;
};

type SendersResponse = {
  senders: Sender[];
  nextPageToken: string | null;
  pageInfo: PageInfo;
};

export type OnboardingResult = {
  success: boolean;
  processed: number;
  sendersOnboarded: number;
  message: string;
};

type GmailContextType = {
  // Auth
  isConnected: boolean;
  email: string | null;
  isLoading: boolean;
  error: string | null;
  connectGmail: () => Promise<void>;
  disconnectGmail: () => Promise<void>;

  // Senders
  senders: Sender[];
  nextPageToken: string | null;
  isLoadingSenders: boolean;
  sendersError: string | null;
  fetchSenders: (token?: string) => Promise<void>;
  searchSenders: (query: string) => Promise<void>;

  // Onboarding & Watching
  addSender: (sender: Pick<Sender, 'name' | 'email'>) => Promise<Sender | null>;
  onboardSavedSenders: () => Promise<OnboardingResult | null>;
  setupWatch: () => Promise<boolean>;
  isAddingSender: boolean;
  isOnboarding: boolean;
};

// --- Context ---
const GmailContext = createContext<GmailContextType | undefined>(undefined);

// --- Provider ---
export const GmailProvider = ({ children }: { children: React.ReactNode }) => {
  const api = useAxios();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State definitions with proper types
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [senders, setSenders] = useState<Sender[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingSenders, setIsLoadingSenders] = useState<boolean>(false);
  const [sendersError, setSendersError] = useState<string | null>(null);

  const [isAddingSender, setIsAddingSender] = useState<boolean>(false);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);

  // --- Auth & Initial Load ---
  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ isConnected: boolean; email: string | null }>("/gmail/status");
      setIsConnected(data.isConnected);
      setEmail(data.email);
    } catch (err) {
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
      setIsConnected(true);
      setEmail(connectedEmail);
      setIsLoading(false);
      router.replace(pathname, { scroll: false });
    } else {
      checkConnectionStatus();
    }
  }, [searchParams, pathname, router, checkConnectionStatus]);

  const connectGmail = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{ url: string }>("/gmail/consent");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError("Failed to start connection.");
      setIsLoading(false);
    }
  };

  const disconnectGmail = async () => {
    setIsLoading(true);
    try {
      await api.post("/gmail/disconnect");
      setIsConnected(false);
      setEmail(null);
      setSenders([]);
      setNextPageToken(null);
    } catch (err) {
      setError("Failed to disconnect.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Sender API Functions ---
  const fetchSenders = useCallback(async (token?: string) => {
    setIsLoadingSenders(true);
    setSendersError(null);
    try {
      const { data } = await api.get<SendersResponse>("/gmail/senders", {
        params: { pageToken: token, pageSize: 50 },
      });
      setSenders(prev => token ? [...prev, ...data.senders] : data.senders);
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setSendersError("Failed to fetch senders.");
    } finally {
      setIsLoadingSenders(false);
    }
  }, []);

  const searchSenders = useCallback(async (query: string) => {
    if (!query) {
      fetchSenders();
      return;
    }
    setIsLoadingSenders(true);
    setSendersError(null);
    try {
      const { data } = await api.get<SendersResponse>("/gmail/senders/search", {
        params: { sender: query, pageSize: 50 },
      });
      setSenders(data.senders);
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setSendersError("Failed to search senders.");
    } finally {
      setIsLoadingSenders(false);
    }
  }, [fetchSenders]);

  // --- Onboarding & Watch API Functions ---
  const addSender = async (senderData: Pick<Sender, 'name' | 'email'>): Promise<Sender | null> => {
    setIsAddingSender(true);
    try {
      const response = await api.post<{ success: boolean; data: Sender }>("/gmail/sender", senderData);
      return response.data.data;
    } catch (err: any) {
      if (err.response?.status !== 409) setSendersError("Failed to add sender.");
      return null;
    } finally {
      setIsAddingSender(false);
    }
  };

  const onboardSavedSenders = async (): Promise<OnboardingResult | null> => {
    setIsOnboarding(true);
    setSendersError(null);
    try {
      const { data } = await api.post<OnboardingResult>("/gmail/senders/emails");
      return data;
    } catch (err) {
      setSendersError("Failed to onboard emails.");
      return null;
    } finally {
      setIsOnboarding(false);
    }
  };

  const setupWatch = async (): Promise<boolean> => {
    try {
      await api.post("/gmail/watch");
      return true;
    } catch (err) {
      setSendersError("Failed to set up live updates.");
      return false;
    }
  };

  const value: GmailContextType = {
    isConnected, email, isLoading, error, connectGmail, disconnectGmail,
    senders, nextPageToken, isLoadingSenders, sendersError, fetchSenders, searchSenders,
    addSender, onboardSavedSenders, setupWatch, isAddingSender, isOnboarding,
  };

  return <GmailContext.Provider value={value}>{children}</GmailContext.Provider>;
};

// --- Custom Hook ---
export const useGmail = (): GmailContextType => {
  const context = useContext(GmailContext);
  if (context === undefined) {
    throw new Error("useGmail must be used within a GmailProvider");
  }
  return context;
};