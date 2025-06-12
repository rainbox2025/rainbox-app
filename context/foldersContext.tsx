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
import { FolderType, SenderType } from "@/types/data";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";
import { AxiosResponse } from "axios";
import { useSenders } from "./sendersContext";

interface FoldersContextType {
  folders: FolderType[];
  setFolders: Dispatch<SetStateAction<FolderType[]>>;
  isFoldersLoading: boolean;
  foldersListError: string | null;
  createFolderError: string | null;
  createFolder: (name: string) => Promise<void>;
  deleteFolderError: string | null;
  deleteFolder: (id: string) => Promise<void>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  addSenderToFolder: (folderId: string, senderId: string) => Promise<void>;
  moveSenderToRoot: (senderId: string, folderId: string) => void;
  getSenders: (folderId: string) => Promise<SenderType[]>;
  isLoadingSenders: boolean;
  toggleReadFolder: (folderId: string, isRead: boolean) => Promise<void>;
}

const FoldersContext = createContext<FoldersContextType | null>(null);

export const FoldersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = createClient();
  const { removeSender: removeSenderFromRoot, addSender: addSenderToRoot } = useSenders();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(false);
  const [foldersListError, setFoldersListError] = useState<string | null>(null);
  const [isLoadingSenders, setIsLoadingSenders] = useState<boolean>(false);
  const [createFolderError, setCreateFolderError] = useState<string | null>(
    null
  );
  const [deleteFolderError, setDeleteFolderError] = useState<string | null>(
    null
  );

  const api = useAxios();

  const fetchFolders = useCallback(async () => {
    try {
      setIsFoldersLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const response = await api.get(`/folders/user/${user.user.id}`);
      setFolders(response.data);
    } catch (error) {
      setFoldersListError(
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error(error);
    } finally {
      setIsFoldersLoading(false);
    }
  }, []);

  const createFolder = useCallback(
    async (name: string) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const response = await api.post(`/folders`, {
          name,
          user_id: user.user.id,
        });

        const newFolder = response.data;
        setFolders((prevFolders) => [...prevFolders, newFolder]);
      } catch (error) {
        setCreateFolderError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api, supabase]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;
        await api.delete(`/folders/${id}`);
        setFolders((prevFolders) =>
          prevFolders.filter((folder) => folder.id !== id)
        );
      } catch (error) {
        setDeleteFolderError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api, supabase]
  );

  const addSenderToFolder = useCallback(
    async (senderId: string, folderId: string) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const response = await api.post(`/folders/sender/${senderId}`, {
          folder_id: folderId,
        });

        if (!response?.data?.sender) {
          console.error("No sender returned from API");
          return;
        }

        removeSenderFromRoot(senderId);

        setFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.id === folderId
              ? {
                ...folder,
                senders: [...(folder.senders || []), response.data.sender],
              }
              : folder
          )
        );
      } catch (error) {
        console.error(error);
      }
    },
    [api, supabase, removeSenderFromRoot]
  );

  const moveSenderToRoot = (senderId: string, folderId: string) => {
    let senderToMove: SenderType | undefined;

    setFolders(prevFolders => {
      return prevFolders.map(folder => {
        if (folder.id === folderId) {
          const senderIndex = folder.senders?.findIndex(s => s.id === senderId) || -1;
          if (senderIndex !== -1 && folder.senders) {
            senderToMove = folder.senders[senderIndex];
            const updatedSenders = [...folder.senders];
            updatedSenders.splice(senderIndex, 1);
            return { ...folder, senders: updatedSenders };
          }
        }
        return folder;
      });
    });

    if (senderToMove) {
      addSenderToRoot({ ...senderToMove, folder_id: undefined });
    }
  };

  const getSenders = useCallback(
    async (folderId: string): Promise<SenderType[]> => {
      setIsLoadingSenders(true);
      try {
        const response: AxiosResponse<SenderType[]> = await api.get(
          `/folders/getSenders/${folderId}`
        );
        setIsLoadingSenders(false);
        return response.data;
      } catch (error) {
        console.error(error);
        setIsLoadingSenders(false);
        return [];
      }
    },
    [api]
  );

  const renameFolder = useCallback(
    async (folderId: string, name: string) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        await api.patch(`/folders/${folderId}`, { name });
        setFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.id === folderId ? { ...folder, name } : folder
          )
        );
      } catch (error) {
        console.error(error);
      }
    },
    [api, supabase]
  );

  const toggleReadFolder = useCallback(
    async (folderId: string, isRead: boolean) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        await api.patch(`/folders/read`, {
          folder_id: folderId,
          isRead: isRead,
        });
        setFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.id === folderId ? { ...folder, isRead } : folder
          )
        );
      } catch (error) {
        console.error(error);
      }
    },
    [api, supabase]
  );

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return (
    <FoldersContext.Provider
      value={{
        folders,
        setFolders,
        isFoldersLoading,
        foldersListError,
        createFolderError,
        createFolder,
        deleteFolderError,
        deleteFolder,
        renameFolder,
        addSenderToFolder,
        moveSenderToRoot,
        getSenders,
        isLoadingSenders,
        toggleReadFolder,
      }}
    >
      {children}
    </FoldersContext.Provider>
  );
};

export const useFolders = () => {
  const context = useContext(FoldersContext);
  if (!context) {
    throw new Error("useFolders must be used within a FoldersProvider");
  }
  return context;
};