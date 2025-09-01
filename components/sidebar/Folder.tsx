import { FolderType, SenderType } from "@/types/data";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellSlashIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import SortableSender from "./Sender";
import { BasicModal } from "../modals/basic-modal";
import { useState, useRef, useEffect } from "react";
import { DeleteConfirmationModal } from "../modals/delete-modal";
import { useFolders } from "@/context/foldersContext";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";

type SidebarItem =
  | { type: "folder"; id: string; data: FolderType }
  | { type: "sender"; id: string; data: SenderType };

interface FolderProps {
  folder: FolderType;
  expanded: boolean;
  toggleExpanded: (id: string) => void;
  activeFolder: string | null;
  activeItem: SidebarItem | null;
}

export default function FolderComponent({
  folder,
  expanded,
  toggleExpanded,
  activeFolder,
  activeItem,
}: FolderProps) {
  const {
    deleteFolder,
    renameFolder,
    toggleReadFolder,
    toggleNotificationFolder,
    isDeletingFolderId,
    isRenamingFolderId,
    isTogglingReadStateId,
    isTogglingNotificationStateId,
  } = useFolders();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenamingModalOpen, setIsRenamingModalOpen] = useState(false);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [isMarkAsReadModalOpen, setIsMarkAsReadModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [unfollowOnDelete, setUnfollowOnDelete] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `folder-${folder.id}`,
    data: { type: "folder", folder },
  });

  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: "folder", folder },
  });

  const isDropTarget = isOver && activeItem?.type === "sender";

  const style = {
    transform: isDropTarget ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const combinedRef = (node: HTMLDivElement) => {
    setNodeRef(node);
    setDroppableNodeRef(node);
  };

  const isFolderActive = activeFolder === folder.id;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsRenamingModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsDeletingModalOpen(true);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsMarkAsReadModalOpen(true);
  };

  const handleMuteNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsNotificationModalOpen(true);
  };

  const folderSenders = folder.senders || [];
  const senderIds = folderSenders.map((s) => `sender-${s.id}`);

  return (
    <>
      <div ref={combinedRef} style={style}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => toggleExpanded(folder.id)}
          className={`group px-md p-xs flex items-center justify-between rounded-md transition-colors cursor-pointer hover:bg-accent ${isDropTarget ? "bg-primary/10 border border-primary/50" : ""}`}
        >
          <div
            {...attributes}
            {...listeners}
            className="flex items-center space-x-md flex-grow"
          >
            <div className="flex-shrink-0">
              {expanded ? (
                <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-sm font-medium truncate overflow-hidden overflow-ellipsis w-0 flex-1 mr-2 text-foreground">
              {folder.name}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative group" ref={menuRef}>
              <button
                onClick={handleMenuClick}
                className="p-xs hover:cursor-pointer text-muted-foreground rounded-full transition-all duration-350 ease-in-out opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground"
              >
                <EllipsisHorizontalIcon className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-8 w-48 bg-content text-popover-foreground rounded-md shadow-lg py-1 z-20 border border-border"
                  >
                    <button
                      className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary"
                      onClick={handleMarkAsRead}
                    >
                      <CheckIcon className="w-4 h-4" />{" "}
                      <span>
                        {folder.isRead ? "Mark as unread" : "Mark as read"}
                      </span>
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary"
                      onClick={handleMuteNotifications}
                    >
                      {/* <-- FIX: The text now correctly shows the action to be performed. --> */}
                      <BellSlashIcon className="w-4 h-4" />{" "}
                      <span>
                        {folder.notification
                          ? "Mute notification"
                          : "Unmute notification"}
                      </span>
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary"
                      onClick={handleRename}
                    >
                      <PencilIcon className="w-4 h-4" /> <span>Rename</span>
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary"
                      onClick={handleDelete}
                    >
                      <TrashIcon className="w-4 h-4" /> <span>Delete</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {folder.count > 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                {folder.count >= 1000
                  ? `${Math.floor(folder.count / 1000)}K+`
                  : folder.count}
              </span>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <SortableContext
                items={senderIds}
                strategy={verticalListSortingStrategy}
              >
                {folderSenders.length > 0 ? (
                  <div className="ml-6 mt-1 space-y-1">
                    {folderSenders.map((sender) => (
                      <SortableSender key={sender.id} sender={sender} />
                    ))}
                  </div>
                ) : (
                  <div className="ml-10 py-2 text-sm text-muted-foreground">
                    No senders in this folder
                  </div>
                )}
              </SortableContext>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BasicModal
        isOpen={isRenamingModalOpen}
        onClose={() => setIsRenamingModalOpen(false)}
        onSave={async (newName) => {
          await renameFolder(folder.id, newName);
        }}
        initialValue={folder.name}
        title="Rename Folder"
        isLoading={isRenamingFolderId === folder.id}
      />
      <DeleteConfirmationModal
        isOpen={isDeletingModalOpen}
        onClose={() => setIsDeletingModalOpen(false)}
        onConfirm={async () => {
          await deleteFolder(folder.id, unfollowOnDelete);
        }}
        showUnfollowOption={true}
        itemName={folder.name}
        itemType="folder"
        isLoading={isDeletingFolderId === folder.id}
        onUnfollowChange={setUnfollowOnDelete}
      />

      <DeleteConfirmationModal
        isOpen={isMarkAsReadModalOpen}
        onClose={() => setIsMarkAsReadModalOpen(false)}
        onConfirm={async () => {
          // <-- FIX: Correctly calls toggleReadFolder and removes the comma operator bug.
          await toggleReadFolder(folder.id, !folder.isRead);
        }}
        itemName={folder.name}
        itemType={folder.isRead ? "markasunread" : "markasread"}
        isLoading={isTogglingReadStateId === folder.id}
      />

      <DeleteConfirmationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onConfirm={async () => {
          // The onConfirm logic was already correct, toggling the state.
          await toggleNotificationFolder(folder.id, !folder.notification);
        }}
        itemName={folder.name}
        // <-- FIX: The itemType is now based on `folder.notification` state, not `folder.isRead`.
        itemType={
          folder.notification ? "mutenotification" : "unmutenotification"
        }
        isLoading={isTogglingNotificationStateId === folder.id}
      />
    </>
  );
}
