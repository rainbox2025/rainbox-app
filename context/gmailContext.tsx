"use client";

import { createContext, useContext, useEffect, useState } from "react";

type GmailContextType = {
  email: string | null;
  isConnected: boolean;
  connectGmail: () => void;
};

const GmailContext = createContext<GmailContextType>({
  email: null,
  isConnected: false,
  connectGmail: () => { },
});

export const GmailProvider = ({ children }: { children: React.ReactNode }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectGmail = () => {
    console.log("Connect gmail clicked")
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!;
    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email"
    );
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    window.location.href = oauthUrl;
  };

  useEffect(() => {
    const checkGmailConnection = async () => {
      try {
        const res = await fetch(window.location.href);
        const data = await res.json();
        if (data.success && data.email) {
          setEmail(data.email);
          setIsConnected(true);
        }
      } catch (err) {
        console.error("Gmail check failed");
      }
    };

    checkGmailConnection();
  }, []);

  return (
    <GmailContext.Provider value={{ email, isConnected, connectGmail }}>
      {children}
    </GmailContext.Provider>
  );
};

export const useGmail = () => useContext(GmailContext);
