import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FolderType, SenderType } from "@/types/data";
import { SenderIcon } from "./SenderIcon";
import FolderComponent from "./Folder";
import SenderComponent from "./Sender";
import { ConfirmModal } from "./ConfirmationModal";
import { Modal } from "./Modal";
import { useFolders } from "@/context/foldersContext";
import { useSenders } from "@/context/sendersContext";

export default function Inbox() {
  const { folders, isFoldersLoading, createFolder, deleteFolder, addSenderToFolder, reorderFolders } = useFolders();
  const { senders, isSendersLoading } = useSenders();
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSender, setActiveSender] = useState<SenderType | null>(null);
  const [activeFolder, setActiveFolder] = useState<FolderType | null>(null);
  const [focusedFolder, setFocusedFolder] = useState<string | null>(
    "marketing"
  ); // Default focus on Marketing

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSenderModalOpen, setIsSenderModalOpen] = useState(false);
  const [selectedSender, setSelectedSender] = useState<SenderType | null>(null);
  const [currentAction, setCurrentAction] = useState<
    "delete" | "unfollow" | null
  >(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  // Initialize expanded folders state when folders load
  useEffect(() => {
    if (!isFoldersLoading && folders.length > 0) {
      setExpandedFolders(
        folders.reduce(
          (acc, folder) => ({
            ...acc,
            [folder.id]: folder.isExpanded || false,
          }),
          {}
        )
      );
    }
  }, [folders, isFoldersLoading]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
    setFocusedFolder(folderId);
  };

  const openFolderCreationModal = () => {
    setIsFolderModalOpen(true);
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    // This would need to be implemented in the folder context
    console.log(`Rename folder ${folderId} to ${newName}`);
  };

  const handleDeleteFolder = () => {
    if (targetId) {
      deleteFolder(targetId);

      // Clean up expanded state
      setExpandedFolders((prev) => {
        const newState = { ...prev };
        delete newState[targetId];
        return newState;
      });

      // Reset focus if needed
      if (focusedFolder === targetId) {
        setFocusedFolder(null);
      }

      setIsConfirmModalOpen(false);
      setCurrentAction(null);
      setTargetId(null);
    }
  };

  const handleUnfollowSender = () => {
    console.log(`Unfollowing sender with ID: ${targetId}`);
    setIsConfirmModalOpen(false);
    setCurrentAction(null);
    setTargetId(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    if (active.id.toString().startsWith("sender-")) {
      const senderId = active.id.toString().replace("sender-", "");
      const sender = senders.find((s) => s.id === senderId);
      if (sender) {
        setActiveSender(sender);
      }
    } else if (active.id.toString().startsWith("folder-")) {
      const folderId = active.id.toString().replace("folder-", "");
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        setActiveFolder(folder);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveSender(null);
      setActiveFolder(null);
      return;
    }

    // Moving a sender
    if (active.id.toString().startsWith("sender-") && over) {
      const senderId = active.id.toString().replace("sender-", "");
      const sender = senders.find((s) => s.id === senderId);

      if (!sender) return;

      let targetFolder = "";

      // If dropped over a folder
      if (over.id.toString().startsWith("folder-")) {
        targetFolder = over.id.toString().replace("folder-", "");

        console.log(
          `Moved ${sender.name} from ${sender.folder || "root"} to ${targetFolder || "root"}`
        );

        addSenderToFolder(sender.id, targetFolder);

        // Force re-render of the target folder
        if (!expandedFolders[targetFolder]) {
          setExpandedFolders((prev) => ({
            ...prev,
            [targetFolder]: true,
          }));
        }

        // Focus the folder
        setFocusedFolder(targetFolder);
      }
      // If dropped over another sender or root items
      else {
        console.log(`Reordering sender or moving to root area`);
      }
    }
    // Moving a folder
    else if (
      active.id.toString().startsWith("folder-") &&
      over.id.toString().startsWith("folder-")
    ) {
      // Call the reorderFolders function from context
      if (active.id !== over.id) {
        reorderFolders(active.id.toString(), over.id.toString());
      }
    }

    // Clear drag state
    setTimeout(() => {
      setActiveId(null);
      setActiveSender(null);
      setActiveFolder(null);
    }, 50);
  };

  // Get root items (not in any folder)
  const rootSenders = senders.filter((sender) => !sender.folder || sender.folder === "");

  // Get senders for a specific folder
  const getSendersForFolder = (folderId: string) => {
    return senders.filter((sender) => sender.folder === folderId);
  };

  // Calculate total count for display
  const totalCount = senders.reduce((total, sender) => total + (sender.count || 0), 0);

  if (isFoldersLoading || isSendersLoading) {
    return (
      <div className="flex-1 bg-background text-foreground rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <div key={index} className="mb-3">
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const folderIds = folders.map((folder) => `folder-${folder.id}`);
  const rootSenderIds = rootSenders.map((sender) => `sender-${sender.id}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 bg-background text-foreground rounded-lg">
        <div className="px-4 w-[99%] p-xs pr-2 flex items-center justify-between sticky top-0 bg-background z-10">
          <h3 className="font-medium text-sm text-muted-foreground">Inbox</h3>
          <button
            className="p-xs text-muted-foreground hover:cursor-pointer hover:text-foreground rounded-full hover:bg-accent transition-colors"
            onClick={openFolderCreationModal}
          >
            <FolderPlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-md py-sm flex items-center justify-between bg-background hover:bg-accent rounded-md cursor-pointer">
          <div className="flex items-center space-x-md">
            <FolderIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">All</span>
          </div>
          <span className="text-xs text-muted-foreground">{totalCount}</span>
        </div>

        <div className="px-0 py-0">
          {/* Folders */}
          <SortableContext
            items={folderIds}
            strategy={verticalListSortingStrategy}
          >
            {folders.map((folder) => (
              <FolderComponent
                key={folder.id}
                folder={folder}
                expanded={expandedFolders[folder.id] || false}
                toggleExpanded={toggleFolder}
                senders={getSendersForFolder(folder.id)}
                activeFolder={focusedFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={(folderId) => {
                  setTargetId(folderId);
                  setCurrentAction("delete");
                  setIsConfirmModalOpen(true);
                }}
              />
            ))}
          </SortableContext>

          {/* Root Items (not in any folder) */}
          <motion.div
            id="root-items"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SortableContext
              items={rootSenderIds}
              strategy={verticalListSortingStrategy}
            >
              {rootSenders.map((sender) => (
                <SenderComponent
                  key={sender.id}
                  sender={sender}
                />
              ))}
            </SortableContext>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-center text-xs text-muted-foreground">
          <p>Drag items to rearrange or move between folders</p>
          <p className="mt-1">All changes are automatically saved</p>
        </div>
      </div>

      {/* Folder Creation Modal */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={(folderName) => { createFolder(folderName); setIsFolderModalOpen(false) }}
        title="Create New Folder"
      />

      {/* Confirmation Modal (for delete/unfollow) */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setCurrentAction(null);
          setTargetId(null);
        }}
        onConfirm={() => {
          if (currentAction === "delete") handleDeleteFolder();
          if (currentAction === "unfollow") handleUnfollowSender();
        }}
        title={currentAction === "delete" ? "Delete Folder" : "Unfollow Sender"}
        description={
          currentAction === "delete"
            ? "Are you sure you want to delete this folder? This operation cannot be undone."
            : "Are you sure you want to unfollow this sender?"
        }
        showUnfollowOption={currentAction === "delete"}
      />

      <DragOverlay>
        {activeId && activeSender && (
          <div className="px-md py-1.5 flex items-center justify-between rounded-md bg-secondary dark:bg-secondary text-foreground shadow-md">
            <div className="flex items-center space-x-3">
              <SenderIcon sender={activeSender} />
              <span className="text-sm">{activeSender.name}</span>
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {activeSender.count >= 1000
                ? `${Math.floor(activeSender.count / 1000)}K+`
                : activeSender.count}
            </span>
          </div>
        )}

        {activeId && activeFolder && (
          <div className="px-md py-2 flex items-center justify-between rounded-md bg-secondary dark:bg-secondary text-foreground shadow-md">
            <div className="flex items-center space-x-3">
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{activeFolder.name}</span>
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {activeFolder.count}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}