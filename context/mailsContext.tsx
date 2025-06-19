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
import { useSenders } from "./sendersContext";

interface PaginationInfo {
  currentPage: number;
  hasMore: boolean;
  totalPages: number;
  totalCount: number;
}

interface MailsContextType {
  mails: Mail[];
  isMailsLoading: boolean;
  isFetchingMore: boolean;
  mailsListError: string | null;
  markAsRead: (id: string, read?: boolean) => Promise<void>;
  bookmark: (id: string, bookmark?: boolean) => Promise<void>;
  summarize: (id: string) => Promise<string>;
  selectedMail: Mail | null;
  setSelectedMail: (mail: Mail | null) => void;
  summarizeLoading: boolean;
  refreshMails: () => Promise<void>;
  markAsReadAllBySenderId: (senderId: string) => Promise<void>;
  loadMoreMails: () => void; // Simplified function for the component
  paginationInfo: PaginationInfo;
}

const MailsContext = createContext<MailsContextType | null>(null);

const INITIAL_PAGINATION_STATE: PaginationInfo = {
  currentPage: 1,
  hasMore: true,
  totalPages: 1,
  totalCount: 0,
};

export const MailsProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const api = useAxios();
  const { selectedSender, setSenders, senders } = useSenders();

  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
  const [mails, setMails] = useState<Mail[]>([]);
  const [isMailsLoading, setIsMailsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>(
    INITIAL_PAGINATION_STATE
  );

  const [mailsListError, setMailsListError] = useState<string | null>(null);
  const [markAsReadError, setMarkAsReadError] = useState<string | null>(null);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [summarizeLoading, setSummarizeLoading] = useState(false);

  // General fetch function
  const fetchMails = useCallback(
    async (page: number = 1) => {
      if (page === 1) setIsMailsLoading(true);
      else setIsFetchingMore(true);

      setMailsListError(null);

      try {
        let response;
        if (selectedSender) {
          response = await api.get(
            `/mails/sender/${selectedSender.id}?page=${page}&pageSize=20`
          );
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not authenticated");
          response = await api.get(
            `/mails/user/${user.id}?page=${page}&pageSize=20`
          );
        }

        const { data: newMails, pagination } = response.data;
        setMails((prevMails) =>
          page === 1 ? newMails : [...prevMails, ...newMails]
        );
        setPaginationInfo({
          currentPage: pagination.page,
          hasMore: pagination.hasMore,
          totalPages: pagination.totalPages,
          totalCount: pagination.totalCount,
        });

      } catch (error) {
        setMailsListError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      } finally {
        setIsMailsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [api, selectedSender, supabase.auth]
  );

  // Trigger fetch when selectedSender changes (or for initial load)
  useEffect(() => {
    setMails([]);
    setSelectedMail(null);
    setPaginationInfo(INITIAL_PAGINATION_STATE);
    fetchMails(1);
  }, [selectedSender]); // fetchMails is stable due to useCallback

  const loadMoreMails = useCallback(() => {
    if (!isFetchingMore && paginationInfo.hasMore) {
      fetchMails(paginationInfo.currentPage + 1);
    }
  }, [isFetchingMore, paginationInfo, fetchMails]);

  const refreshMails = useCallback(async () => {
    fetchMails(1);
  }, [fetchMails]);

  const markAsRead = useCallback(async (id: string, read = true) => {
    try {
      await api.patch(`/mails/read/${id}`, { read });
      setMails((prev) => prev.map((mail) => (mail.id === id ? { ...mail, read } : mail)));
      if (selectedSender) {
        const newSenders = senders.map((sender) =>
          sender.id === selectedSender?.id ? { ...sender, count: read ? sender.count - 1 : sender.count + 1 } : sender
        );
        setSenders(newSenders);
      }
    } catch (error) {
      setMarkAsReadError(error instanceof Error ? error.message : "Unknown error");
    }
  }, [api, senders, selectedSender, setSenders]);

  const markAsReadAllBySenderId = useCallback(async (senderId: string) => {
    try {
      await api.patch(`/mails/read/sender/${senderId}`);
      setMails((prev) => prev.map((mail) => mail.sender_id === senderId ? { ...mail, read: true } : mail));
      const newSenders = senders.map((sender) => sender.id === selectedSender?.id ? { ...sender, count: 0 } : sender);
      setSenders(newSenders);
    } catch (error) {
      console.error(error);
    }
  }, [api, senders, selectedSender, setSenders]);

  const bookmark = useCallback(async (id: string, bookmark = true) => {
    try {
      await api.patch(`/mails/bookmark/${id}`, { bookmark });
      setMails((prev) => prev.map((mail) => mail.id === id ? { ...mail, bookmarked: bookmark } : mail));
    } catch (error) {
      setBookmarkError(error instanceof Error ? error.message : "Unknown error");
    }
  }, [api]);

  const summarize = useCallback(async (id: string) => {
    try {
      setSummarizeLoading(true);
      const response = await api.get(`/mails/summarize/${id}`);
      return response.data;
    } catch (error) {
      setSummarizeError(error instanceof Error ? error.message : "Unknown error");
      return "";
    } finally {
      setSummarizeLoading(false);
    }
  }, [api]);

  return (
    <MailsContext.Provider
      value={{
        mails,
        isMailsLoading,
        isFetchingMore,
        mailsListError,
        markAsRead,
        bookmark,
        summarize,
        selectedMail,
        setSelectedMail,
        summarizeLoading,
        refreshMails,
        markAsReadAllBySenderId,
        loadMoreMails,
        paginationInfo,
      }}
    >
      {children}
    </MailsContext.Provider>
  );
};

export const useMails = () => {
  const context = useContext(MailsContext);
  if (!context) {
    throw new Error("useMails must be used within a MailsProvider");
  }
  return context;
};