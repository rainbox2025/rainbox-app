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
  selectedSender: SenderType | null;
  // Loading states for specific actions
  updatingSenderId: string | null;
  togglingReadId: string | null;
  togglingNotificationId: string | null;
  unsubscribingId: string | null;
  // Action functions
  updateSenderInRoot: (sender: SenderType) => void;
  fetchSenders: () => Promise<void>;
  unsubcribeSender: (id: string) => Promise<void>;
  updateSender: (id: string, formData: FormData) => Promise<SenderType>;
  toggleReadSender: (senderId: string) => Promise<SenderType>;
  toggleNotificationSender: (senderId: string, currentStatus: boolean) => Promise<SenderType>;
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

  // --- NEW: Granular loading states ---
  const [updatingSenderId, setUpdatingSenderId] = useState<string | null>(null);
  const [togglingReadId, setTogglingReadId] = useState<string | null>(null);
  const [togglingNotificationId, setTogglingNotificationId] = useState<string | null>(null);
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);

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

  const updateSender = useCallback(
    async (id: string, formData: FormData) => {
      setUpdatingSenderId(id);
      try {
        // 1. Make the API call
        const { data: updatedSender } = await api.patch(`/senders/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // 2. IMPORTANT: Return the updated sender object from the server
        return updatedSender;

      } catch (error) {
        console.error("Failed to update sender", error);
        throw error; // Re-throw to be caught by the component
      } finally {
        setUpdatingSenderId(null);
      }
    },
    [api] // Dependencies are now simpler
  );

  const updateSenderInRoot = (updatedSender: SenderType) => {
    setSenders((prev) =>
      prev.map((s) => (s.id === updatedSender.id ? updatedSender : s))
    );
  };

  const unsubcribeSender = useCallback(
    async (id: string) => {
      setUnsubscribingId(id);
      try {
        // Send a simple JSON payload. The backend will handle it correctly now.
        await api.patch(`/senders/${id}`, { subscribed: false });

        // On success, remove the sender from the local state (delete-like operation)
        setSenders((prev) => prev.filter((sender) => sender.id !== id));
        if (selectedSender?.id === id) {
          setSelectedSender(null);
        }
      } catch (error) {
        console.error("Failed to unfollow sender", error);
        throw error; // Let the component know about the error
      } finally {
        setUnsubscribingId(null);
      }
    },
    [api, selectedSender]
  );

  const toggleReadSender = useCallback(
    async (senderId: string) => {
      setTogglingReadId(senderId);
      try {
        // The API now returns the updated sender
        const { data: updatedSender } = await api.patch(`/senders/read`, { sender_id: senderId });
        return updatedSender; // Return it
      } catch (error) {
        console.error("Failed to toggle read state", error);
        throw error;
      } finally {
        setTogglingReadId(null);
      }
    },
    [api]
  );

  const toggleNotificationSender = useCallback(
    async (senderId: string, currentStatus: boolean) => {
      setTogglingNotificationId(senderId);
      try {
        // The API call returns the updated sender from the server
        const { data: updatedSender } = await api.patch(`/senders/${senderId}`, {
          notification: !currentStatus
        });

        // IMPORTANT: Return the updated sender object
        return updatedSender;

      } catch (error) {
        console.error("Failed to toggle notification", error);
        throw error;
      } finally {
        setTogglingNotificationId(null);
      }
    },
    [api]
  )

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
        selectedSender,
        // Pass down loading states
        updatingSenderId,
        togglingReadId,
        togglingNotificationId,
        unsubscribingId,
        // Pass down actions
        updateSenderInRoot,
        fetchSenders,
        unsubcribeSender,
        updateSender,
        toggleReadSender,
        toggleNotificationSender,
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