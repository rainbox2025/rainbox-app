// src/context/outlookContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAxios } from "@/hooks/useAxios";
import { Suspense } from 'react';
import { Sender, OnboardingResult } from "./gmailContext"; // Re-using types from Gmail context
import { filterAvailableSenders } from "@/lib/senderUtils";
import { useMemo } from "react";
import { useSenders } from "./sendersContext";
import { useAuth } from "./authContext";

// --- Type Definitions ---
type SendersResponse = {
  senders: Sender[];
  nextPageToken: string | null;
  pageInfo: { hasNextPage: boolean;[key: string]: any; };
};

type ConnectionStatus = 'idle' | 'success' | 'error';

type OutlookContextType = {
  // Auth
  isConnected: boolean;
  email: string | null;
  isLoading: boolean;
  error: string | null;
  connectionAttemptStatus: ConnectionStatus;
  resetConnectionAttempt: () => void;
  connectOutlook: () => Promise<void>;
  disconnectOutlook: () => Promise<void>;

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

  // State setters for the handler
  checkConnectionStatus: () => Promise<void>;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setEmail: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setConnectionAttemptStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>;
};

// --- Context ---
const OutlookContext = createContext<OutlookContextType | undefined>(undefined);

// --- Connection Handler Component ---
function OutlookConnectionHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setIsConnected, setEmail, setError, setConnectionAttemptStatus } = useOutlook();



  useEffect(() => {
    const outlookConnected = searchParams.get("outlook_connected");
    const oauthError = searchParams.get("error");
    const connectedEmail = searchParams.get("email");

    if (outlookConnected === "true" && connectedEmail) {
      setIsConnected(true);
      setEmail(connectedEmail);
      setConnectionAttemptStatus('success');
      router.replace(pathname, { scroll: false });
    } else if (oauthError?.includes('outlook')) { // Check if the error is from outlook
      setError(`OAuth failed: ${oauthError}`);
      setConnectionAttemptStatus('error');
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname, setIsConnected, setEmail, setError, setConnectionAttemptStatus]);

  return null;
}

// --- Provider ---
export const OutlookProvider = ({ children }: { children: React.ReactNode }) => {
  const api = useAxios();
  const { senders: onboardedSenders } = useSenders();

  const onboardedSenderEmails = useMemo(() =>
    new Set(onboardedSenders.map(s => s.email))
    , [onboardedSenders]);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttemptStatus, setConnectionAttemptStatus] = useState<ConnectionStatus>('idle');
  const [senders, setSenders] = useState<Sender[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingSenders, setIsLoadingSenders] = useState<boolean>(false);
  const [sendersError, setSendersError] = useState<string | null>(null);
  const [isAddingSender, setIsAddingSender] = useState<boolean>(false);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const { accessToken } = useAuth();

  // You need to create this API endpoint: /api/outlook/status
  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ isConnected: boolean; email: string | null }>("/outlook/status");
      setIsConnected(data.isConnected);
      setEmail(data.email);
    } catch (err) {
      setIsConnected(false);
      setEmail(null);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (accessToken) {
      checkConnectionStatus();
    } else {
      setIsConnected(false);
      setEmail(null);
    }
  }, [accessToken, checkConnectionStatus]);

  const resetConnectionAttempt = () => {
    setConnectionAttemptStatus('idle');
    setError(null);
  };

  const connectOutlook = async () => {
    setIsLoading(true);
    resetConnectionAttempt();
    try {
      const { data } = await api.post<{ url: string }>("/outlook/consent");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError("Failed to start Outlook connection.");
      setIsLoading(false);
    }
  };

  const disconnectOutlook = async () => {
    setIsLoading(true);
    try {
      await api.post("/outlook/disconnect");
      setIsConnected(false);
      setEmail(null);
      setSenders([]);
      setNextPageToken(null);
    } catch (err) {
      setError("Failed to disconnect Outlook.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSenders = useCallback(async (token?: string) => {
    // This function now ONLY handles pagination (loading more results)
    if (isLoadingSenders || !token) return;
    setIsLoadingSenders(true);
    setSendersError(null);
    try {
      const { data } = await api.get<SendersResponse>("/outlook/senders", {
        params: { pageToken: token, pageSize: 100 },
      });

      setSenders(prev => {
        const localEmails = new Set(prev.map(s => s.email));
        const uniqueNewSenders = filterAvailableSenders(data.senders, onboardedSenderEmails, localEmails);
        return [...prev, ...uniqueNewSenders];
      });
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setSendersError("Failed to fetch more Outlook senders.");
    } finally {
      setIsLoadingSenders(false);
    }
  }, [api, isLoadingSenders, onboardedSenderEmails]);

  const searchSenders = useCallback(async (query: string) => {
    // This function now handles initial load AND searching. It always REPLACES the list.
    if (isLoadingSenders) return;
    setIsLoadingSenders(true);
    setSendersError(null);
    try {
      const endpoint = query ? "/outlook/senders/search" : "/outlook/senders";
      const params = query
        ? { sender: query, pageSize: 100 }
        : { pageSize: 100 };

      const { data } = await api.get<SendersResponse>(endpoint, { params });

      const availableResults = filterAvailableSenders(data.senders, onboardedSenderEmails);

      setSenders(availableResults);
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setSendersError("Failed to search Outlook senders.");
      setSenders([]);
      setNextPageToken(null);
    } finally {
      setIsLoadingSenders(false);
    }
  }, [api, isLoadingSenders, onboardedSenderEmails]);

  const addSender = async (senderData: Pick<Sender, 'name' | 'email'>): Promise<Sender | null> => {
    setIsAddingSender(true);
    try {
      const response = await api.post<{ success: boolean; data: Sender }>("/outlook/sender", senderData);
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
      const { data } = await api.post<OnboardingResult>("/outlook/senders/emails");
      return data;
    } catch (err) {
      setSendersError("Failed to onboard emails from Outlook.");
      return null;
    } finally {
      setIsOnboarding(false);
    }
  };

  const setupWatch = async (): Promise<boolean> => {
    try {
      await api.post("/outlook/watch");
      return true;
    } catch (err) {
      setSendersError("Failed to set up live updates for Outlook.");
      return false;
    }
  };

  const value: OutlookContextType = {
    isConnected, email, isLoading, error, connectionAttemptStatus, resetConnectionAttempt,
    connectOutlook, disconnectOutlook, senders, nextPageToken, isLoadingSenders,
    sendersError, fetchSenders, searchSenders, addSender, onboardSavedSenders,
    setupWatch, isAddingSender, isOnboarding,
    checkConnectionStatus, setIsConnected, setEmail, setError, setConnectionAttemptStatus,
  };

  return (
    <OutlookContext.Provider value={value}>
      <Suspense fallback={null}>
        <OutlookConnectionHandler />
      </Suspense>
      {children}
    </OutlookContext.Provider>
  );
};

export const useOutlook = (): OutlookContextType => {
  const context = useContext(OutlookContext);
  if (context === undefined) throw new Error("useOutlook must be used within an OutlookProvider");
  return context;
};