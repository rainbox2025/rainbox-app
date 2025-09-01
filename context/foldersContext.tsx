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
import { useAuth } from "./authContext";
import { useMails } from "./mailsContext";

interface FoldersContextType {
  folders: FolderType[];
  fetchFolders: () => Promise<void>;
  setFolders: Dispatch<SetStateAction<FolderType[]>>;
  isFoldersLoading: boolean;
  foldersListError: string | null;
  createFolderError: string | null;
  isCreatingFolder: boolean;
  createFolder: (name: string) => Promise<void>;
  deleteFolderError: string | null;
  deleteFolder: (id: string, deleteSenders: boolean) => Promise<void>;
  isDeletingFolderId: string | null;
  addSenderToFolder: (senderId: string, folderId: string) => Promise<void>;
  moveSenderToRoot: (senderId: string) => Promise<void>;
  getSenders: (folderId: string) => Promise<SenderType[]>;
  isLoadingSenders: boolean;
  updateSenderInUI: (sender: SenderType, updatedSender: SenderType) => void;
  sidebarOrder: any;
  setSidebarOrder: Dispatch<SetStateAction<any>>;
  isSidebarOrderLoading: boolean;
  saveSidebarOrder: (order: any) => Promise<void>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  isRenamingFolderId: string | null; // Add this
  toggleReadFolder: (folderId: string, isRead: boolean) => Promise<void>;
  toggleNotificationFolder: (
    folderId: string,
    isRead: boolean
  ) => Promise<void>;
  isTogglingReadStateId: string | null;
  isTogglingNotificationStateId: string | null;
  fetchSidebarOrder: () => Promise<void>;
}

const FoldersContext = createContext<FoldersContextType | null>(null);

export const FoldersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = createClient();
  const {
    removeSender: removeSenderFromRoot,
    addSender: addSenderToRoot,
    updateSenderInRoot,
    setSelectedSender,
    selectedSender,
  } = useSenders();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [isDeletingFolderId, setIsDeletingFolderId] = useState<string | null>(
    null
  );
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [foldersListError, setFoldersListError] = useState<string | null>(null);
  const [isLoadingSenders, setIsLoadingSenders] = useState<boolean>(false);
  const [isRenamingFolderId, setIsRenamingFolderId] = useState<string | null>(
    null
  );
  const [isTogglingReadStateId, setIsTogglingReadStateId] = useState<
    string | null
  >(null);
  const [isTogglingNotificationStateId, setIsTogglingNotificationStateId] =
    useState<string | null>(null);
  const [createFolderError, setCreateFolderError] = useState<string | null>(
    null
  );
  const [deleteFolderError, setDeleteFolderError] = useState<string | null>(
    null
  );
  const [sidebarOrder, setSidebarOrder] = useState<any>(null);
  const [isSidebarOrderLoading, setIsSidebarOrderLoading] = useState(true);
  const { accessToken } = useAuth();
  const { fetchSenders } = useSenders();
  const { setSelectedMail } = useMails();

  const api = useAxios();

  const fetchFolders = useCallback(async () => {
    try {
      setSelectedMail(null);
      setIsFoldersLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const response = await api.get(`/folders/user/${user.user.id}`);
      const fetchedFolders: FolderType[] = response.data;

      const foldersWithCounts = fetchedFolders.map((folder) => {
        const unreadCount = (folder.senders || []).reduce((sum, sender) => {
          return sum + (sender.count || 0);
        }, 0);
        return { ...folder, count: unreadCount };
      });

      setFolders(foldersWithCounts);
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
  }, [api]);

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
    if (accessToken) {
      fetchFolders();
      fetchSidebarOrder();
    }
  }, [accessToken, fetchFolders, fetchSidebarOrder]);

  const createFolder = useCallback(
    async (name: string) => {
      setIsCreatingFolder(true);
      setCreateFolderError(null);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("You must be logged in to create a folder.");
        }

        const response = await api.post(`/folders`, {
          name,
          user_id: user.id,
        });

        const newFolder = response.data;
        setFolders((prevFolders) => [...prevFolders, newFolder]);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error creating folder";
        setCreateFolderError(errorMessage);
        // Re-throw the error so the calling component's catch block is triggered
        throw error;
      } finally {
        setIsCreatingFolder(false);
      }
    },
    [api, supabase]
  );

  const deleteFolder = useCallback(
    async (id: string, deleteSenders: boolean) => {
      setIsDeletingFolderId(id);
      setDeleteFolderError(null);

      // Find the senders to potentially move *before* the API call
      const folderToDelete = folders.find((f) => f.id === id);
      const sendersToMoveToRoot =
        !deleteSenders && folderToDelete?.senders ? folderToDelete.senders : [];

      try {
        await api.delete(`/folders/${id}`, {
          data: { deleteSenders },
        });

        // Optimistically update the UI after successful deletion
        setFolders((prevFolders) =>
          prevFolders.filter((folder) => folder.id !== id)
        );

        // If there are senders to move, add them back to the root sender list
        if (sendersToMoveToRoot.length > 0) {
          sendersToMoveToRoot.forEach((sender) => {
            // Update folder_id to null and add back to the root list
            addSenderToRoot({ ...sender, folder_id: "null" });
          });
        }

        fetchSenders();
      } catch (error) {
        setDeleteFolderError(
          error instanceof Error
            ? error.message
            : "Unknown error deleting folder"
        );
        throw error;
      } finally {
        setIsDeletingFolderId(null);
      }
    },
    [api, folders, addSenderToRoot] // <-- Add `folders` and `addSenderToRoot` to dependency array
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
      setIsRenamingFolderId(folderId); // <-- Set loading state
      try {
        await api.patch(`/folders/${folderId}`, { name });
        setFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.id === folderId ? { ...folder, name } : folder
          )
        );
      } catch (error) {
        console.error(error);
        throw error; // <-- Re-throw error
      } finally {
        setIsRenamingFolderId(null); // <-- Clear loading state
      }
    },
    [api]
  );

  const toggleReadFolder = useCallback(
    async (folderId: string, isRead: boolean) => {
      setIsTogglingReadStateId(folderId); // <-- Set loading state
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
        throw error; // <-- Re-throw error
      } finally {
        setIsTogglingReadStateId(null); // <-- Clear loading state
      }
    },
    [api]
  );
  const toggleNotificationFolder = useCallback(
    async (folderId: string, notification: boolean) => {
      setIsTogglingNotificationStateId(folderId); // <-- Set loading state
      try {
        await api.patch(`/folders/notification`, {
          folder_id: folderId,
          notification: notification,
        });
        setFolders((prevFolders) =>
          prevFolders.map((folder) =>
            folder.id === folderId ? { ...folder, notification } : folder
          )
        );
      } catch (error) {
        console.error(error);
        throw error; // <-- Re-throw error
      } finally {
        setIsTogglingNotificationStateId(null); // <-- Clear loading state
      }
    },
    [api]
  );

  const updateSenderInUI = useCallback(
    (originalSender: SenderType, updatedSender: SenderType) => {
      const originalFolderId = originalSender.folder_id;
      const newFolderId = updatedSender.folder_id;

      // Case 1: Sender's details changed, but it stayed in the same place.
      if (originalFolderId === newFolderId) {
        if (newFolderId) {
          // It's in a folder.
          setFolders((prev) =>
            prev.map((f) =>
              f.id === newFolderId
                ? {
                    ...f,
                    senders: f.senders?.map((s) =>
                      s.id === updatedSender.id ? updatedSender : s
                    ),
                  }
                : f
            )
          );
        } else {
          // It's in the root.
          updateSenderInRoot(updatedSender);
        }
      } else {
        // Case 2: The sender moved between root and a folder.
        // Step 1: Remove from original location
        if (originalFolderId) {
          // Was in a folder, remove it from that folder's list
          setFolders((prev) =>
            prev.map((f) =>
              f.id === originalFolderId
                ? {
                    ...f,
                    senders: f.senders?.filter(
                      (s) => s.id !== updatedSender.id
                    ),
                  }
                : f
            )
          );
        } else {
          // Was in root, remove it from the root list
          removeSenderFromRoot(updatedSender.id);
        }

        // Step 2: Add to new location
        if (newFolderId) {
          // Moved to a folder, add it to the new folder's list
          setFolders((prev) =>
            prev.map((f) =>
              f.id === newFolderId
                ? { ...f, senders: [...(f.senders || []), updatedSender] }
                : f
            )
          );
        } else {
          // Moved to root, add it to the root list
          addSenderToRoot(updatedSender);
        }
      }

      // Finally, if the edited sender was the selected one, update that state too
      if (selectedSender?.id === updatedSender.id) {
        setSelectedSender(updatedSender);
      }
    },
    [
      folders,
      setFolders,
      addSenderToRoot,
      removeSenderFromRoot,
      updateSenderInRoot,
      selectedSender,
      setSelectedSender,
    ]
  );

  return (
    <FoldersContext.Provider
      value={{
        folders,
        fetchFolders,
        setFolders,
        isFoldersLoading,
        foldersListError,
        createFolderError,
        createFolder,
        updateSenderInUI,
        isCreatingFolder,
        deleteFolderError,
        deleteFolder,
        isDeletingFolderId,
        fetchSidebarOrder,
        addSenderToFolder,
        moveSenderToRoot,
        getSenders,
        isLoadingSenders,
        sidebarOrder,
        setSidebarOrder,
        isSidebarOrderLoading,
        saveSidebarOrder,
        renameFolder,
        isRenamingFolderId,
        toggleReadFolder,
        isTogglingReadStateId,
        toggleNotificationFolder,
        isTogglingNotificationStateId,
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
