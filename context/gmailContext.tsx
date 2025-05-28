"use client";

import { useRouter, useSearchParams } from "next/navigation"; // For App Router
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Helper to check if running in browser
const isBrowser = typeof window !== "undefined";

type GmailContextType = {
  email: string | null;
  isConnected: boolean;
  connectGmail: () => void;
  disconnectGmail: () => Promise<void>; // Added for completeness
  isLoading: boolean;
};

const GMAIL_CONNECTED_EMAIL_KEY = "gmailConnectedEmail";

const GmailContext = createContext<GmailContextType>({
  email: null,
  isConnected: false,
  connectGmail: () => { },
  disconnectGmail: async () => { },
  isLoading: true, // Start with loading true
});

export const GmailProvider = ({ children }: { children: React.ReactNode }) => {
  const [email, setEmailState] = useState<string | null>(null);
  const [isConnected, setIsConnectedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams(); // For reading query params reactively

  const setEmail = (newEmail: string | null) => {
    setEmailState(newEmail);
    if (newEmail && isBrowser) {
      localStorage.setItem(GMAIL_CONNECTED_EMAIL_KEY, newEmail);
    } else if (isBrowser) {
      localStorage.removeItem(GMAIL_CONNECTED_EMAIL_KEY);
    }
  };

  const setIsConnected = (connected: boolean) => {
    setIsConnectedState(connected);
  };

  useEffect(() => {
    if (!isBrowser) return;

    const initializeGmailState = () => {
      const gmailSuccess = searchParams.get('gmail_success');
      const gmailEmailParam = searchParams.get('email');

      if (gmailSuccess === 'true' && gmailEmailParam) {
        setEmail(gmailEmailParam);
        setIsConnected(true);

        // Clean the URL by removing query parameters
        const currentPathname = window.location.pathname;
        router.replace(currentPathname, { scroll: false }); // scroll: false to prevent scroll to top
        setIsLoading(false);
      } else {
        // Check localStorage for persisted connection
        const storedEmail = localStorage.getItem(GMAIL_CONNECTED_EMAIL_KEY);
        if (storedEmail) {
          setEmail(storedEmail);
          setIsConnected(true);
          // Potentially verify with backend if token is still valid
        }
        setIsLoading(false);
      }
    };

    initializeGmailState();
  }, [searchParams, router]); // Re-run when searchParams change

  const connectGmail = useCallback(() => {
    setIsLoading(true);
    // Fetch the consent URL from your backend
    // This allows keeping client_id and other sensitive parts on backend if preferred,
    // though current code has it directly in frontend.
    // For now, using the direct method as in original code:

    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!; // This is your backend callback: e.g., https://.../api/auth/gmail/consent/callback

    // Ensure redirectUri is the backend callback, not the frontend page.
    // The backend callback will then redirect to the frontend (/dashboard?params...).

    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email"
    );
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    window.location.href = oauthUrl;
  }, []);

  const disconnectGmail = async () => {
    setIsLoading(true);
    // TODO: Call a backend endpoint to invalidate tokens (both Google's and yours in Supabase/cookies)
    // e.g., await fetch('/api/auth/gmail/disconnect', { method: 'POST' });
    console.log("Simulating Gmail disconnect");
    setEmail(null);
    setIsConnected(false);
    setIsLoading(false);
    // The backend disconnect should also clear the 'consent_tokens' cookie.
  };

  return (
    <GmailContext.Provider value={{ email, isConnected, connectGmail, disconnectGmail, isLoading }}>
      {children}
    </GmailContext.Provider>
  );
};

export const useGmail = () => {
  const context = useContext(GmailContext);
  if (context === undefined) {
    throw new Error("useGmail must be used within a GmailProvider");
  }
  return context;
};