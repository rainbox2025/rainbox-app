"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { Sender, Folder, Mail } from "@/types/data";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";

interface MailsContextType {
  senders: Sender[];
  folders: Folder[];
  mails: Mail[];
}

const MailsContext = createContext<MailsContextType | null>(null);

export const MailsProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const [senders, setSenders] = useState<Sender[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [mails, setMails] = useState<Mail[]>([]);

  const api = useAxios();
  useEffect(() => {
    const fetchSenders = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const data = await api.get(`/senders/user/${user.user.id}`);
      setSenders(data.data);
    };
    const fetchFolders = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const data = await api.get(`/folders/user/${user.user.id}`);
      setFolders(data.data);
    };
    const fetchMails = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      const data = await api.get(`/mails/user/${user.user.id}`);
      setMails(data.data);
    };
    fetchSenders();
    fetchFolders();
    fetchMails();
  }, []);

  return (
    <MailsContext.Provider value={{ senders, folders, mails }}>
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
