"use client";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { Sender, Folder, Mail } from "@/types/data";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";

interface SendersContextType {
  senders: Sender[];
  isSendersLoading: boolean;
  sendersListError: string | null;
  unsubcribeSenderError: string | null;
  unsubcribeSender: (id: string) => Promise<void>;
}

const SendersContext = createContext<SendersContextType | null>(null);

export const SendersProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const [senders, setSenders] = useState<Sender[]>([]);
  const [isSendersLoading, setIsSendersLoading] = useState(false);
  const [sendersListError, setSendersListError] = useState<string | null>(null);
  const [unsubcribeSenderError, setUnsubcribeSenderError] = useState<
    string | null
  >(null);

  const api = useAxios();
  const fetchSenders = useCallback(async () => {
    try {
      setIsSendersLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const data = await api.get(`/senders/user/${user.user.id}`);
      setSenders(data.data);
    } catch (error) {
      setSendersListError(
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error(error);
    } finally {
      setIsSendersLoading(false);
    }
  }, [api, supabase]);
  const unsubcribeSender = useCallback(
    async (id: string) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;
        await api.delete(`/senders/${id}`);
      } catch (error) {
        setUnsubcribeSenderError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api, supabase]
  );

  useEffect(() => {
    fetchSenders();
  }, []);

  return (
    <SendersContext.Provider
      value={{
        senders,
        isSendersLoading,
        sendersListError,
        unsubcribeSenderError,
        unsubcribeSender,
      }}
    >
      {children}
    </SendersContext.Provider>
  );
};

export const useSenders = () => {
  const context = useContext(SendersContext);
  if (!context) {
    throw new Error("useSenders must be used within an SendersProvider");
  }
  return context;
};
