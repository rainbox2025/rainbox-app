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
  addSenderToFolder: (senderId: string, folderId: string) => Promise<void>;
  moveSenderToRoot: (senderId: string) => Promise<void>;
  getSenders: (folderId: string) => Promise<SenderType[]>;
  isLoadingSenders: boolean;
  toggleReadFolder: (folderId: string, isRead: boolean) => Promise<void>;
  sidebarOrder: any;
  isSidebarOrderLoading: boolean;
  saveSidebarOrder: (order: any) => Promise<void>;
}

const FoldersContext = createContext<FoldersContextType | null>(null);

export const FoldersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = createClient();
  const { removeSender: removeSenderFromRoot, addSender: addSenderToRoot } =
    useSenders();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [foldersListError, setFoldersListError] = useState<string | null>(null);
  const [isLoadingSenders, setIsLoadingSenders] = useState<boolean>(false);
  const [createFolderError, setCreateFolderError] = useState<string | null>(
    null
  );
  const [deleteFolderError, setDeleteFolderError] = useState<string | null>(
    null
  );
  const [sidebarOrder, setSidebarOrder] = useState<any>(null);
  const [isSidebarOrderLoading, setIsSidebarOrderLoading] = useState(true);

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
    } finally {
      setIsFoldersLoading(false);
    }
  }, []);

  const fetchSidebarOrder = useCallback(async () => {
    try {
      setIsSidebarOrderLoading(true);
      const response = await api.get("/order/get");
      setSidebarOrder(response.data.order);
    } catch (error) {
      console.error("Failed to fetch sidebar order", error);
    } finally {
      setIsSidebarOrderLoading(false);
    }
  }, []);

  const saveSidebarOrder = useCallback(
    async (order: any) => {
      try {
        await api.post("/reorder", { order });
      } catch (error) {
        console.error("Failed to save sidebar order", error);
      }
    },
    [api]
  );

  useEffect(() => {
    fetchFolders();
    fetchSidebarOrder();
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
      }
    },
    [api, supabase]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/folders/${id}`);
        setFolders((prevFolders) =>
          prevFolders.filter((folder) => folder.id !== id)
        );
      } catch (error) {
        setDeleteFolderError(
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    [api]
  );

  const addSenderToFolder = useCallback(
    async (senderId: string, folderId: string) => {
      try {
        await api.post(`/folders/sender/${senderId}`, {
          folder_id: folderId,
        });
      } catch (error) {
        console.error(error);
        // Implement rollback logic if necessary
      }
    },
    [api]
  );

  const moveSenderToRoot = useCallback(
    async (senderId: string) => {
      try {
        const response = await api.delete(`/folders/sender/${senderId}`);
        const updatedSender = response.data.sender;
        if (updatedSender) {
          addSenderToRoot(updatedSender);
        }
      } catch (error) {
        console.error(error);
        // Implement rollback logic if necessary
      }
    },
    [api, addSenderToRoot]
  );

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
    [api]
  );

  const toggleReadFolder = useCallback(
    async (folderId: string, isRead: boolean) => {
      try {
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
    [api]
  );

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
        sidebarOrder,
        isSidebarOrderLoading,
        saveSidebarOrder,
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