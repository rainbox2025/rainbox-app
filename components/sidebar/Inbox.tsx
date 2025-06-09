import React, { useState, useEffect } from "react";
import { FolderIcon, FolderPlusIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/ui/skeleton";
import FolderComponent from "./Folder";
import Sender from "./Sender";
import { BasicModal } from "../modals/basic-modal";
import { useFolders } from "@/context/foldersContext";
import { useSenders } from "@/context/sendersContext";

export default function Inbox() {
  const { folders, isFoldersLoading, createFolder } = useFolders();
  const { senders, isSendersLoading } = useSenders();
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [focusedFolder, setFocusedFolder] = useState<string | null>(null);
  const openFolderCreationModal = () => setIsFolderModalOpen(true);

  // Initialize expanded state from folder data if available
  useEffect(() => {
    if (!isFoldersLoading) {
      const initialExpandedState = folders.reduce(
        (acc, folder) => ({ ...acc, [folder.id]: folder.isExpanded || false }),
        {}
      );
      setExpandedFolders(initialExpandedState);
    }
  }, [folders, isFoldersLoading]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
    setFocusedFolder(folderId);
  };


  // Calculate total count from all senders
  const totalCount = senders.reduce((total, sender) => total + (sender.count || 0), 0);

  // Filter for senders that are not in any folder
  const rootSenders = senders.filter(sender => !sender.folder_id);

  if (isFoldersLoading || isSendersLoading) {
    return (
      <div className="flex-1 text-foreground rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="mb-3">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 text-foreground rounded-lg">
      <div className="px-4 w-[99%] p-xs pr-2 flex items-center justify-between sticky top-0 z-10 bg-sidebar">
        <h3 className="font-medium text-sm text-muted-foreground">Inbox</h3>
        <button
          className="p-xs text-muted-foreground hover:cursor-pointer hover:text-foreground rounded-full hover:bg-accent"
          onClick={openFolderCreationModal}
          title="Create a new folder"
        >
          <FolderPlusIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="px-md py-sm flex items-center justify-between hover:bg-accent rounded-md cursor-pointer">
        <div className="flex items-center space-x-md">
          <FolderIcon className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium">All</span>
        </div>
        <span className="text-xs text-muted-foreground">{totalCount}</span>
      </div>

      <div className="px-0 py-0 space-y-1">
        {/* Render all folders first */}
        {folders.map((folder) => (
          <FolderComponent
            key={folder.id}
            folder={folder}
            // Pass the initial senders from the folder object for instant display
            senders={folder.senders || []}
            expanded={expandedFolders[folder.id] || false}
            toggleExpanded={toggleFolder}
            activeFolder={focusedFolder}
          />
        ))}

        {/* Render all root-level senders */}
        {rootSenders.map((sender) => (
          <Sender key={sender.id} sender={sender} />
        ))}
      </div>

      {/* Simplified Footer */}
      <div className="px-4 py-3 text-center text-xs text-muted-foreground/30">
        <p>New subscriptions will automatically appear here</p>
      </div>

      {/* Upgrade Box (can be kept or removed as needed) */}
      <div className="px-4 py-3 mt-auto border-border absolute bottom-2">
        <div className="bg-content p-3 rounded-lg shadow-sm">
          <p className="text-sm text-foreground">
            30 days left in your free trial. Keep your reading habit alive.
            <span className="ml-1 text-blue-500 font-semibold cursor-pointer">
              Upgrade now
            </span>
          </p>
        </div>
      </div>

      {/* Folder Creation Modal */}
      <BasicModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={(folderName) => {
          createFolder(folderName);
          setIsFolderModalOpen(false);
        }}
        title="Create New Folder"
      />
    </div>
  );
}