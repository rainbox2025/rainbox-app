"use client";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { SenderType } from "@/types/data";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";

interface SendersContextType {
  senders: SenderType[];
  isSendersLoading: boolean;
  sendersListError: string | null;
  unsubcribeSenderError: string | null;
  unsubcribeSender: (id: string) => Promise<void>;
  renameSenderError: string | null;
  renameSender: (id: string, name: string) => Promise<void>;
  toggleReadSender: (senderId: string, isRead: boolean) => Promise<void>;
  removeSender: (senderId: string) => void;
}

const SendersContext = createContext<SendersContextType | null>(null);

export const SendersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = createClient();
  const [senders, setSenders] = useState<SenderType[]>([]);
  const [isSendersLoading, setIsSendersLoading] = useState(false);
  const [sendersListError, setSendersListError] = useState<string | null>(null);
  const [unsubcribeSenderError, setUnsubcribeSenderError] = useState<
    string | null
  >(null);
  const [renameSenderError, setRenameSenderError] = useState<string | null>(
    null
  );

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
        console.log("came insdie unsubscribe");
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        console.log("unsubscribed to : ", id);
        await api.patch(`/senders/${id}`, { subscribed: false });
        console.log("unsubscribed");

        setSenders((prevSenders) =>
          prevSenders.filter((sender) => sender.id !== id)
        );
      } catch (error) {
        setUnsubcribeSenderError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api, supabase]
  );
  const renameSender = useCallback(
    async (id: string, name: string) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;


        await api.patch(`/senders/${id}`, { name });
        console.log("renamed");

        setSenders((prevSenders) =>
          prevSenders.map((sender) =>
            sender.id === id ? { ...sender, name } : sender
          )
        );
      } catch (error) {
        setRenameSenderError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api, supabase]
  );

  const toggleReadSender = useCallback(
    async (senderId: string, isRead: boolean) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        console.log("toggleSender:", senderId, "to:", isRead);
        await api.patch(`/senders/read`, { sender_id: senderId, isRead: isRead });
        const updatedSenders = senders.map((sender) =>
          sender.id === senderId ? { ...sender, isRead } : sender
        );
        setSenders(updatedSenders);
      } catch (error) {
        console.error(error);
      }
    },
    [api, supabase]
  );

  const removeSender = (senderId: string) => {
    setSenders(prevSenders => prevSenders.filter(sender => sender.id !== senderId));
  };

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
        renameSenderError,
        renameSender,
        toggleReadSender,
        removeSender
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
