"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Import for URL manipulation

type GmailContextType = {
  email: string | null;
  isConnected: boolean;
  connectGmail: () => void;
  disconnectGmail: () => void; // Optional: Add a disconnect function
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
  const router = useRouter(); // For cleaning URL
  const searchParams = useSearchParams(); // To read query params

  const connectGmail = () => {
    console.log("Connect gmail clicked");
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
    // This redirectUri is where Google sends the user back TO YOUR BACKEND API
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!;
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email"
    );
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    window.location.href = oauthUrl;
  };

  // Optional: Implement disconnect
  const disconnectGmail = () => {
    // Here you would typically:
    // 1. Call a backend API to revoke tokens (if necessary) and clear them from DB/cookies.
    // 2. Clear local state.
    setEmail(null);
    setIsConnected(false);
    // Optionally, remove the cookie if your backend doesn't do it or if you want immediate effect
    // document.cookie = "consent_tokens=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    console.log("Gmail disconnected (client-side)");
  };


  useEffect(() => {
    // This effect runs when the component mounts and when searchParams change.
    // It checks for query parameters indicating a successful Gmail connection.
    const gmailConnected = searchParams.get("gmail_connected");
    const connectedEmail = searchParams.get("email");

    if (gmailConnected === "true" && connectedEmail) {
      setEmail(connectedEmail);
      setIsConnected(true);
      console.log("Gmail connected via redirect:", connectedEmail);

      // Clean up URL: remove the query parameters so they don't persist
      // on refresh or navigation.
      const currentPath = window.location.pathname;
      router.replace(currentPath, { scroll: false }); // `replace` doesn't add to history
    } else {
      // Optional: Check if already connected from a previous session,
      // e.g., by calling an API endpoint that verifies the cookie
      // For simplicity, we're only handling the redirect flow here.
      // If you want to persist login across refreshes without query params,
      // you'd need another API call here to check status based on the cookie.
      // Example:
      // const checkPersistedConnection = async () => {
      //   try {
      //     const res = await fetch('/api/auth/status'); // You'd create this endpoint
      //     const data = await res.json();
      //     if (data.success && data.email) {
      //       setEmail(data.email);
      //       setIsConnected(true);
      //     }
      //   } catch (err) {
      //     console.log("No persisted Gmail connection found.");
      //   }
      // };
      // checkPersistedConnection();
    }
  }, [searchParams, router]); // Re-run if searchParams change

  return (
    <GmailContext.Provider value={{ email, isConnected, connectGmail, disconnectGmail }}>
      {children}
    </GmailContext.Provider>
  );
};

export const useGmail = () => useContext(GmailContext);