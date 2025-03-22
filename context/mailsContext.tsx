"use client";
import { createContext, useState, useEffect, useContext } from "react";
import { User, Sender, Folder, Mail } from "@/types/data";
import { createClient } from "@/utils/supabase/client";

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
  useEffect(() => {
    const fetchSenders = async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: senders } = await supabase
        .from("senders")
        .select("*")
        .eq("user_id", user?.user?.id);
      if (senders) {
        setSenders(senders as Sender[]);
      }
    };
    const fetchFolders = async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: folders } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user?.user?.id);
      if (folders) {
        setFolders(folders as Folder[]);
      }
    };
    const fetchMails = async () => {
      const { data: user } = await supabase.auth.getUser();
      const { data: mails } = await supabase
        .from("mails")
        .select("*")
        .eq("user_id", user?.user?.id);
      if (mails) {
        setMails(mails as Mail[]);
      }
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
