"use client";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { SenderType } from "@/types/data";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";

interface SendersContextType {
  senders: SenderType[];
  isSendersLoading: boolean;
  sendersListError: string | null;
  unsubcribeSenderError: string | null;
  updateSenderError: string | null;
  selectedSender: SenderType | null;
  fetchSenders: () => Promise<void>;
  unsubcribeSender: (id: string) => Promise<void>;
  updateSender: (id: string, formData: FormData) => Promise<void>;
  toggleReadSender: (senderId: string, isRead: boolean) => Promise<void>;
  removeSender: (senderId: string) => void;
  addSender: (sender: SenderType) => void;
  setSelectedSender: (sender: SenderType | null) => void;
  setSenders: Dispatch<SetStateAction<SenderType[]>>;
}

const SendersContext = createContext<SendersContextType | null>(null);

export const SendersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = createClient();
  const [selectedSender, setSelectedSender] = useState<SenderType | null>(null);
  const [senders, setSenders] = useState<SenderType[]>([]);
  const [isSendersLoading, setIsSendersLoading] = useState(false);
  const [sendersListError, setSendersListError] = useState<string | null>(null);
  const [unsubcribeSenderError, setUnsubcribeSenderError] = useState<string | null>(null);
  const [updateSenderError, setUpdateSenderError] = useState<string | null>(null);
  const api = useAxios();

  const fetchSenders = useCallback(async () => {
    try {
      setIsSendersLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await api.get(`/senders/user/${user.id}`);
      setSenders(data);
    } catch (error) {
      setSendersListError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSendersLoading(false);
    }
  }, []);

  const unsubcribeSender = useCallback(
    async (id: string) => {
      try {
        await api.patch(`/senders/${id}`, { subscribed: false });
        setSenders((prev) => prev.filter((sender) => sender.id !== id));
      } catch (error) {
        setUnsubcribeSenderError(error instanceof Error ? error.message : "Unknown error");
      }
    },
    [api]
  );

  const updateSender = useCallback(
    async (id: string, formData: FormData) => {
      try {
        console.log("formObj: ", Object.fromEntries(formData.entries()));
        setUpdateSenderError(null);
        const { data: updatedSender } = await api.patch(`/senders/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSenders((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedSender } : s)));
        if (selectedSender?.id === id) {
          setSelectedSender((prev) => (prev ? { ...prev, ...updatedSender } : null));
        }
      } catch (error) {
        setUpdateSenderError(error instanceof Error ? error.message : "Failed to update sender");
        throw error;
      }
    },
    [selectedSender]
  );

  const toggleReadSender = useCallback(
    async (senderId: string, isRead: boolean) => {
      try {
        await api.patch(`/senders/read`, { sender_id: senderId, isRead });
        setSenders((prev) =>
          prev.map((sender) => (sender.id === senderId ? { ...sender, isRead } : sender))
        );
      } catch (error) {
        console.error(error);
      }
    },
    [api]
  );

  const removeSender = (senderId: string) => {
    setSenders((prev) => prev.filter((sender) => sender.id !== senderId));
  };

  const addSender = (sender: SenderType) => {
    setSenders((prev) => [...prev, sender]);
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
        updateSenderError,
        selectedSender,
        fetchSenders,
        unsubcribeSender,
        updateSender,
        toggleReadSender,
        removeSender,
        addSender,
        setSelectedSender,
        setSenders,
      }}
    >
      {children}
    </SendersContext.Provider>
  );
};

export const useSenders = () => {
  const context = useContext(SendersContext);
  if (!context) {
    throw new Error("useSenders must be used within a SendersProvider");
  }
  return context;
};