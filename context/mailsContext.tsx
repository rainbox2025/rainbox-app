"use client";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { Mail, SenderType } from "@/types/data";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";
import { useSenders } from "./sendersContext";

interface MailsContextType {
  mails: Mail[];
  isMailsLoading: boolean;
  mailsListError: string | null;
  markAsReadError: string | null;
  markAsRead: (id: string, read?: boolean) => Promise<void>;
  bookmarkError: string | null;
  bookmark: (id: string, bookmark?: boolean) => Promise<void>;
  summarizeError: string | null;
  summarize: (id: string) => Promise<string>;
  getMailsBySender: (senderId: string) => Promise<Mail[]>;
  selectedMail: Mail | null;
  setSelectedMail: (mail: Mail | null) => void;
  summarizeLoading: boolean;
  refreshMails: () => Promise<void>;
  markAsReadAllBySenderId: (senderId: string) => Promise<void>;
}

const MailsContext = createContext<MailsContextType | null>(null);

export const MailsProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const { selectedSender, setSenders, senders } = useSenders();
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [mails, setMails] = useState<Mail[]>([]);
  const [isMailsLoading, setIsMailsLoading] = useState(false);
  const [mailsListError, setMailsListError] = useState<string | null>(null);
  const [markAsReadError, setMarkAsReadError] = useState<string | null>(null);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const api = useAxios();
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  const fetchMails = useCallback(async () => {
    try {
      setIsMailsLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const data = await api.get(`/mails/user/${user.user.id}`);
      setMails(data.data);
    } catch (error) {
      setMailsListError(
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error(error);
    } finally {
      setIsMailsLoading(false);
    }
  }, [api, supabase]);
  const markAsRead = useCallback(
    async (id: string, read = true) => {
      try {
        await api.patch(`/mails/read/${id}`, { read });
        setMails((prev) =>
          prev.map((mail) => (mail.id === id ? { ...mail, read } : mail))
        );
        const newSenders = senders.map((sender) =>
          sender.id === selectedSender?.id
            ? { ...sender, count: read ? sender.count - 1 : sender.count + 1 }
            : sender
        );
        setSenders(newSenders);
      } catch (error) {
        setMarkAsReadError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api]
  );
  const markAsReadAllBySenderId = useCallback(
    async (senderId: string) => {
      try {
        await api.patch(`/mails/read/sender/${senderId}`);
        setMails((prev) =>
          prev.map((mail) =>
            mail.sender_id === senderId ? { ...mail, read: true } : mail
          )
        );
        const newSenders = senders.map((sender) =>
          sender.id === selectedSender?.id ? { ...sender, count: 0 } : sender
        );
        setSenders(newSenders);
      } catch (error) {
        console.error(error);
      }
    },
    [api]
  );
  const bookmark = useCallback(
    async (id: string, bookmark = true) => {
      try {
        await api.patch(`/mails/bookmark/${id}`, { bookmark });
        setMails((prev) =>
          prev.map((mail) =>
            mail.id === id ? { ...mail, bookmarked: bookmark } : mail
          )
        );
      } catch (error) {
        setBookmarkError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api]
  );
  const summarize = useCallback(
    async (id: string) => {
      try {
        setSummarizeLoading(true);
        const response = await api.get(`/mails/summarize/${id}`);
        return response.data;
      } catch (error) {
        setSummarizeError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      } finally {
        setSummarizeLoading(false);
      }
    },
    [api]
  );
  const getMailsBySender = useCallback(
    async (senderId: string) => {
      try {
        const response = await api.get(`/mails/sender/${senderId}`);
        return response.data;
      } catch (error) {
        setMailsListError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api]
  );
  const refreshMails = useCallback(async () => {
    if (selectedSender) {
      try {
        setIsMailsLoading(true);
        const mails = await getMailsBySender(selectedSender.id);
        setMails(mails);
        setIsMailsLoading(false);
      } catch (error) {
        console.error(error);
      } finally {
        setIsMailsLoading(false);
      }
    }
  }, [selectedSender]);

  useEffect(() => {
    const fetchMails = async () => {
      if (selectedSender) {
        try {
          setIsMailsLoading(true);
          const mails = await getMailsBySender(selectedSender.id);
          setMails(mails);
          setIsMailsLoading(false);
        } catch (error) {
          console.error(error);
        } finally {
          setIsMailsLoading(false);
        }
      }
    };
    fetchMails();
  }, [selectedSender]);

  useEffect(() => {
    fetchMails();
  }, []);


  return (
    <MailsContext.Provider
      value={{
        mails,
        isMailsLoading,
        mailsListError,
        markAsReadError,
        markAsRead,
        bookmarkError,
        bookmark,
        summarizeError,
        summarize,
        getMailsBySender,
        selectedMail,
        setSelectedMail,
        summarizeLoading,
        refreshMails,
        markAsReadAllBySenderId,
      }}
    >
      {children}
    </MailsContext.Provider>
  );
};

export const useMails = () => {
  const context = useContext(MailsContext);
  if (!context) {
    throw new Error("useMails must be used within an MailsProvider");
  }
  return context;
};
