// src/context/gmailContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAxios } from "@/hooks/useAxios";
import { Suspense } from 'react';
import { useSenders } from "./sendersContext";
import { filterAvailableSenders } from "@/lib/senderUtils";

// --- Type Definitions ---
export type Sender = {
  id?: string;
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

type ConnectionStatus = 'idle' | 'success' | 'error';

// CHANGE THIS
type GmailContextType = {
  // Auth
  isConnected: boolean;
  email: string | null;
  isLoading: boolean;
  error: string | null;
  connectionAttemptStatus: ConnectionStatus;
  resetConnectionAttempt: () => void;
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

  // --- ADD THESE ---
  // Allow the handler to modify the state
  checkConnectionStatus: () => Promise<void>;
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setEmail: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setConnectionAttemptStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>;
};

// --- Context ---
const GmailContext = createContext<GmailContextType | undefined>(undefined);

// ADD THIS NEW COMPONENT
function GmailConnectionHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // This logic is now isolated here
  const { checkConnectionStatus, setIsConnected, setEmail, setError, setConnectionAttemptStatus } = useGmail();

  useEffect(() => {
    const gmailConnected = searchParams.get("gmail_connected");
    const oauthError = searchParams.get("error");
    const connectedEmail = searchParams.get("email");

    if (gmailConnected === "true" && connectedEmail) {
      setIsConnected(true);
      setEmail(connectedEmail);
      setConnectionAttemptStatus('success');
      router.replace(pathname, { scroll: false });
    } else if (oauthError) {
      setError(`OAuth failed: ${oauthError}`);
      setConnectionAttemptStatus('error');
      router.replace(pathname, { scroll: false });
    } else {
      // checkConnectionStatus is now called from the main provider
    }
  }, [searchParams, router, pathname, setIsConnected, setEmail, setError, setConnectionAttemptStatus]);

  return null; // This component does not render anything
}





// --- Provider ---
export const GmailProvider = ({ children }: { children: React.ReactNode }) => {
  const api = useAxios();
  const { senders: onboardedSenders } = useSenders();
  // State definitions
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
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const resetConnectionAttempt = () => {
    setConnectionAttemptStatus('idle');
    setError(null);
  };

  const connectGmail = async () => {
    setIsLoading(true);
    resetConnectionAttempt();
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

  const onboardedSenderEmails = useMemo(() =>
    new Set(onboardedSenders.map(s => s.email))
    , [onboardedSenders]);

  const fetchSenders = useCallback(async (token?: string) => {
    if (isLoadingSenders) return;
    setIsLoadingSenders(true);
    setSendersError(null);
    try {
      const { data } = await api.get<SendersResponse>("/gmail/senders", {
        params: { pageToken: token, pageSize: 20 },
      });

      setSenders(prev => {
        const localEmails = new Set(prev.map(s => s.email));
        const uniqueNewSenders = filterAvailableSenders(data.senders, onboardedSenderEmails, localEmails);
        return token ? [...prev, ...uniqueNewSenders] : uniqueNewSenders;
      });
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setSendersError("Failed to fetch senders.");
    } finally {
      setIsLoadingSenders(false);
    }
  }, [onboardedSenders]);

  const searchSenders = useCallback(async (query: string) => {
    if (!query) {
      setSenders([]);
      setNextPageToken(null);
      await fetchSenders();
      return;
    }

    if (isLoadingSenders) return;
    setIsLoadingSenders(true);
    setSendersError(null);
    try {
      const { data } = await api.get<SendersResponse>("/gmail/senders/search", {
        params: { sender: query, pageSize: 50 },
      });

      // For search, we don't need to check against local state, only global.
      const availableSearchResults = filterAvailableSenders(data.senders, onboardedSenderEmails);

      setSenders(availableSearchResults);
      setNextPageToken(data.nextPageToken);
    } catch (err) {
      setSendersError("Failed to search senders.");
    } finally {
      setIsLoadingSenders(false);
    }
  }, []);

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
    isConnected, email, isLoading, error, connectionAttemptStatus, resetConnectionAttempt,
    connectGmail, disconnectGmail, senders, nextPageToken, isLoadingSenders,
    sendersError, fetchSenders, searchSenders, addSender, onboardSavedSenders,
    setupWatch, isAddingSender, isOnboarding,

    // --- ADD THESE ---
    // Pass the setters and check function into the context
    checkConnectionStatus,
    setIsConnected,
    setEmail,
    setError,
    setConnectionAttemptStatus,
  };

  return <GmailContext.Provider value={value}>
    <Suspense fallback={null}>
      <GmailConnectionHandler />
    </Suspense>
    {children}
  </GmailContext.Provider>;
};

export const useGmail = (): GmailContextType => {
  const context = useContext(GmailContext);
  if (context === undefined) throw new Error("useGmail must be used within a GmailProvider");
  return context;
};