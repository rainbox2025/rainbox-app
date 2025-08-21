"use client";

import {
  createContext,
  useState,
  useEffect, 
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { Mail } from "@/types/data";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";
import { useSenders } from "./sendersContext";
import { useAuth } from "./authContext";

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
  loadMoreMails: () => void;
  paginationInfo: PaginationInfo;
  summarizeError?: string | null;
}

const MailsContext = createContext<MailsContextType | null>(null);

const INITIAL_PAGINATION_STATE: PaginationInfo = {
  currentPage: 1,
  hasMore: true,
  totalPages: 1,
  totalCount: 0,
};

export const MailsProvider = ({ children }: { children: ReactNode }) => {
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
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [summarizeLoading, setSummarizeLoading] = useState(false);
  const { accessToken } = useAuth();

  const fetchMails = useCallback(
    async (page: number = 1) => {
      if (page === 1) setIsMailsLoading(true);
      else setIsFetchingMore(true);
      setMailsListError(null);
      setSelectedMail(null);
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
        setMails((prevMails) => (page === 1 ? newMails : [...prevMails, ...newMails]));
        setPaginationInfo({
          currentPage: pagination.page,
          hasMore: pagination.hasMore,
          totalPages: pagination.totalPages,
          totalCount: pagination.totalCount,
        });
      } catch (error) {
        setMailsListError(error instanceof Error ? error.message : "Unknown error");
        console.error(error);
      } finally {
        setIsMailsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [api, selectedSender, supabase.auth]
  );

  useEffect(() => {
    if (!accessToken) {
      setMails([]);
      setPaginationInfo(INITIAL_PAGINATION_STATE);
      return;
    }
    setMails([]);
    setSelectedMail(null);
    setPaginationInfo(INITIAL_PAGINATION_STATE);
    fetchMails(1);
  }, [accessToken, selectedSender]); 

  
  useEffect(() => {
    if (selectedMail) {
      
      const updatedMailInList = mails.find((m) => m.id === selectedMail.id);
      
      
      setSelectedMail(updatedMailInList || null);
    }
    
  }, [mails]);

  const loadMoreMails = useCallback(() => {
    if (!isFetchingMore && paginationInfo.hasMore) {
      fetchMails(paginationInfo.currentPage + 1);
    }
  }, [isFetchingMore, paginationInfo, fetchMails]);

  const refreshMails = useCallback(async () => {
    await fetchMails(1);
  }, [fetchMails]);

  const markAsRead = useCallback(async (id: string, read = true) => {
    
    const originalMails = mails;
    setMails((prev) => prev.map((mail) => (mail.id === id ? { ...mail, read } : mail)));
    if (selectedSender) {
        const originalSenders = senders;
        setSenders(prev => prev.map(s => s.id === selectedSender.id ? {...s, count: s.count + (read ? -1 : 1) } : s));
    }
    try {
      await api.patch(`/mails/read/${id}`, { read });
    } catch (error) {
        setMails(originalMails); 
        console.error("Failed to mark as read:", error);
    }
  }, [api, mails, selectedSender, senders, setSenders]);

  const markAsReadAllBySenderId = useCallback(
    async (senderId: string) => {
      const originalMails = mails;
      setMails((prev) => prev.map((mail) => mail.sender_id === senderId ? { ...mail, read: true } : mail));
      try {
        await api.patch(`/mails/read/sender/${senderId}`);
      } catch (error) {
        setMails(originalMails);
        console.error(error);
      }
    },
    [api, mails]
  );

  const bookmark = useCallback(async (id: string, bookmarked = true) => {
    const originalMails = mails;
    setMails((prev) => prev.map((mail) => mail.id === id ? { ...mail, bookmarked } : mail));
    try {
      await api.patch(`/mails/bookmark/${id}`, { bookmark });
    } catch (error) {
        setMails(originalMails);
        console.error("Failed to update bookmark:", error);
    }
  }, [api, mails]);

  const summarize = useCallback(
    async (id: string) => {
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
    },
    [api]
  );

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
        summarizeError
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