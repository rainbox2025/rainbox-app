"use client";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { Mail } from "@/types/data";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";

interface MailsContextType {
  mails: Mail[];
  isMailsLoading: boolean;
  mailsListError: string | null;
  markAsReadError: string | null;
  markAsRead: (id: string) => Promise<void>;
  bookmarkError: string | null;
  bookmark: (id: string) => Promise<void>;
  summarizeError: string | null;
  summarize: (id: string) => Promise<void>;
}

const MailsContext = createContext<MailsContextType | null>(null);

export const MailsProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const [mails, setMails] = useState<Mail[]>([]);
  const [isMailsLoading, setIsMailsLoading] = useState(false);
  const [mailsListError, setMailsListError] = useState<string | null>(null);
  const [markAsReadError, setMarkAsReadError] = useState<string | null>(null);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const api = useAxios();
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
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
        await api.put(`/mails/read/${id}`, { read });
      } catch (error) {
        setMarkAsReadError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api]
  );
  const bookmark = useCallback(
    async (id: string, bookmark = true) => {
      try {
        await api.put(`/mails/bookmark/${id}`, { bookmark });
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
        const response = await api.get(`/mails/summarize/${id}`);
        return response.data;
      } catch (error) {
        setSummarizeError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api]
  );
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
