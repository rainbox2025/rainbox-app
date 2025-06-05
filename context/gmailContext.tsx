"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Helper function to get a cookie by name
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') { // Guard for SSR or pre-hydration
    return null;
  }
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Helper function to delete a cookie
function deleteCookie(name: string, path: string = '/', domain?: string) {
  if (typeof document === 'undefined') return;
  let cookieString = name + "=; Max-Age=-99999999;";
  if (path) cookieString += " path=" + path + ";";
  if (domain) cookieString += " domain=" + domain + ";";
  // For good measure, also set expires to a past date
  cookieString += " expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  document.cookie = cookieString;
}


type ConsentTokenData = {
  email: string;
  // Potentially other token details, but email is what we need for context
  // access_token?: string;
  // refresh_token?: string;
  // expires_at?: number;
};

type GmailContextType = {
  email: string | null;
  isConnected: boolean;
  connectGmail: () => void;
  disconnectGmail: () => void;
};

const GmailContext = createContext<GmailContextType>({
  email: null,
  isConnected: false,
  connectGmail: () => { },
  disconnectGmail: () => { },
});

export const GmailProvider = ({ children }: { children: React.ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Effect 1: Check for persisted connection via cookie on mount
  useEffect(() => {
    const tokenCookie = getCookie("consent_tokens");
    if (tokenCookie) {
      try {
        // Assuming the cookie stores a JSON string with { email: "..." }
        const parsedData: ConsentTokenData = JSON.parse(tokenCookie);
        if (parsedData && parsedData.email) {
          setEmail(parsedData.email);
          setIsConnected(true);
        } else {
          deleteCookie("consent_tokens", "/"); // Clear potentially bad cookie
          setIsConnected(false);
          setEmail(null);
        }
      } catch (error) {
        console.error("Failed to parse consent token cookie:", error);
        deleteCookie("consent_tokens", "/");
        setIsConnected(false);
        setEmail(null);
      }
    } else {
      console.log("No consent token cookie found.");
      if (isConnected || email) {
        setIsConnected(false);
        setEmail(null);
      }
    }
  }, []); // Empty dependency array: runs only once on mount

  // Effect 2: Handle OAuth redirect (after initial cookie check)
  useEffect(() => {
    // This effect runs when searchParams change (e.g., after Google redirect)
    // It should only override the cookie state if a new successful connection occurs.
    const gmailConnected = searchParams.get("gmail_connected");
    const connectedEmailParam = searchParams.get("email");

    if (gmailConnected === "true" && connectedEmailParam) {
      // A new connection has just happened via redirect
      if (email !== connectedEmailParam || !isConnected) {
        console.log("Gmail connected via redirect, updating state:", connectedEmailParam);
        setEmail(connectedEmailParam);
        setIsConnected(true);
      }

      // Clean up URL: remove the query parameters
      const currentPath = window.location.pathname;
      router.replace(currentPath, { scroll: false });
    }
    // No 'else' here that resets state, because the cookie check effect handles initial state.
    // If there's no redirect, we rely on the cookie state.
  }, [searchParams, router, email, isConnected]); // Add email and isConnected to deps if they influence decisions inside

  const connectGmail = () => {
    console.log("Connect gmail clicked");
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!; // This is your backend API
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email"
    );
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    window.location.href = oauthUrl;
  };

  const disconnectGmail = async () => {
    console.log("Attempting to disconnect Gmail...");
    // 1. Call a backend API to revoke tokens and clear them from DB/server-side cookies.
    // This is crucial for a full logout.
    try {
      // Example: await fetch('/api/auth/google/logout', { method: 'POST' });
      // If your backend handles cookie clearing upon logout, that's ideal.
      console.log("Backend logout call would be here.");
    } catch (error) {
      console.error("Error calling backend logout:", error);
    }

    // 2. Clear client-side state and cookie.
    setEmail(null);
    setIsConnected(false);
    deleteCookie("consent_tokens", "/"); // Ensure path matches where it was set
    console.log("Gmail disconnected (client-side state and cookie cleared).");
    // Optionally, redirect or update UI further
  };

  return (
    <GmailContext.Provider value={{ email, isConnected, connectGmail, disconnectGmail }}>
      {children}
    </GmailContext.Provider>
  );
};

export const useGmail = () => useContext(GmailContext);