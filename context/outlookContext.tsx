// context/outlookContext.tsx

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Helper function to get a cookie by name
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
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
  cookieString += " expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  document.cookie = cookieString;
}


type ConsentTokenData = {
  email: string;
};

type OutlookContextType = {
  email: string | null;
  isConnected: boolean;
  connectOutlook: () => void;
  disconnectOutlook: () => void;
};

const OutlookContext = createContext<OutlookContextType>({
  email: null,
  isConnected: false,
  connectOutlook: () => { },
  disconnectOutlook: () => { },
});

export const OutlookProvider = ({ children }: { children: React.ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // It's safer to use a different cookie name for Outlook to avoid conflicts
  const OUTLOOK_COOKIE_NAME = "outlook_consent_tokens";

  // Effect 1: Check for persisted connection via cookie on mount
  useEffect(() => {
    const tokenCookie = getCookie(OUTLOOK_COOKIE_NAME);
    if (tokenCookie) {
      try {
        const parsedData: ConsentTokenData = JSON.parse(tokenCookie);
        if (parsedData && parsedData.email) {
          setEmail(parsedData.email);
          setIsConnected(true);
        } else {
          deleteCookie(OUTLOOK_COOKIE_NAME, "/");
          setIsConnected(false);
          setEmail(null);
        }
      } catch (error) {
        console.error("Failed to parse outlook consent token cookie:", error);
        deleteCookie(OUTLOOK_COOKIE_NAME, "/");
        setIsConnected(false);
        setEmail(null);
      }
    } else {
      console.log("No outlook consent token cookie found.");
      if (isConnected || email) {
        setIsConnected(false);
        setEmail(null);
      }
    }
  }, []); // Runs once on mount

  // Effect 2: Handle OAuth redirect
  useEffect(() => {
    const outlookConnected = searchParams.get("outlook_connected");
    const connectedEmailParam = searchParams.get("email");

    if (outlookConnected === "true" && connectedEmailParam) {
      if (email !== connectedEmailParam || !isConnected) {
        console.log("Outlook connected via redirect, updating state:", connectedEmailParam);
        setEmail(connectedEmailParam);
        setIsConnected(true);
      }

      const currentPath = window.location.pathname;
      router.replace(currentPath, { scroll: false });
    }
  }, [searchParams, router, email, isConnected]);

  const connectOutlook = () => {
    console.log("Connect Outlook clicked");
    // Microsoft Graph API OAuth2 endpoint
    const clientId = process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID!; // IMPORTANT: Use a separate client ID for Outlook
    const redirectUri = process.env.NEXT_PUBLIC_OUTLOOK_REDIRECT_URI!; // IMPORTANT: Use a separate redirect URI for Outlook
    const scope = encodeURIComponent(
      "openid profile email User.Read Mail.Read offline_access"
    );
    const oauthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scope}&prompt=consent`;

    window.location.href = oauthUrl;
  };

  const disconnectOutlook = async () => {
    console.log("Attempting to disconnect Outlook...");
    // Backend call to revoke tokens would go here
    setEmail(null);
    setIsConnected(false);
    deleteCookie(OUTLOOK_COOKIE_NAME, "/");
    console.log("Outlook disconnected (client-side state and cookie cleared).");
  };

  return (
    <OutlookContext.Provider value={{ email, isConnected, connectOutlook, disconnectOutlook }}>
      {children}
    </OutlookContext.Provider>
  );
};

export const useOutlook = () => useContext(OutlookContext);