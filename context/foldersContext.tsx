"use client";
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { FolderType, SenderType } from "@/types/data";
import { createClient } from "@/utils/supabase/client";
import { useAxios } from "@/hooks/useAxios";
import { AxiosResponse } from "axios";

interface FoldersContextType {
  folders: FolderType[];
  isFoldersLoading: boolean;
  foldersListError: string | null;
  createFolderError: string | null;
  createFolder: (name: string) => Promise<void>;
  deleteFolderError: string | null;
  deleteFolder: (id: string) => Promise<void>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  addSenderToFolder: (folderId: string, senderId: string) => Promise<void>;
  getSenders: (folderId: string) => Promise<SenderType[]>;
  isLoadingSenders: boolean;
}

const FoldersContext = createContext<FoldersContextType | null>(null);

export const FoldersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = createClient();
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
      const data = await api.get(`/folders/user/${user.user.id}`);
      setFolders(data.data);
    } catch (error) {
      setFoldersListError(
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error(error);
    } finally {
      setIsFoldersLoading(false);
    }
  }, [api, supabase]);

  const createFolder = useCallback(
    async (name: string) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        console.log("User ID:", user.user.id);
        console.log("folder name:", name);
        const data = await api.post(`/folders`, { name, user_id: user.user.id });
        console.log("New folder created:", data.data);
        setFolders([...folders, data.data]);
      } catch (error) {
        setCreateFolderError(
          error instanceof Error ? error.message : "Unknown error"
        );
        console.error(error);
      }
    },
    [api, supabase, folders]
  );
  const deleteFolder = useCallback(
    async (id: string) => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;
        await api.delete(`/folders/${id}`);
        setFolders(folders.filter((folder) => folder.id !== id));
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

        console.log("Adding sender:", senderId, "to folder:", folderId);
        const data = await api.post(`/folders/sender/${senderId}`, { folder_id: folderId });
        console.log("Sender added to folder successfully.: ", data.data);

        fetchFolders();
      } catch (error) {
        console.error(error);
      }
    },
    [api, supabase]
  );
  const getSenders = useCallback(
    async (folderId: string): Promise<SenderType[]> => {
      setIsLoadingSenders(true);
      try {
        const response: AxiosResponse<SenderType[]> = await api.get(`/folders/getSenders/${folderId}`);
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
        const updatedFolders = folders.map((folder) =>
          folder.id === folderId ? { ...folder, name } : folder
        );
        setFolders(updatedFolders);
      } catch (error) {
        console.error(error);
      }
    },
    [api, supabase]
  );
  useEffect(() => {
    fetchFolders();
  }, []);

  return (
    <FoldersContext.Provider
      value={{
        folders,
        isFoldersLoading,
        foldersListError,
        createFolderError,
        createFolder,
        deleteFolderError,
        deleteFolder,
        renameFolder,
        addSenderToFolder,
        getSenders,
        isLoadingSenders,
      }}
    >
      {children}
    </FoldersContext.Provider>
  );
};

export const useFolders = () => {
  const context = useContext(FoldersContext);
  if (!context) {
    throw new Error("useFolders must be used within an FoldersProvider");
  }
  return context;
};
