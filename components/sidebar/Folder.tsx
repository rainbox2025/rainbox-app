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
import Sender from "./Sender";
import { BasicModal } from "../modals/basic-modal";
import { useState, useRef, useEffect } from "react";
import { DeleteConfirmationModal } from "../modals/delete-modal";
import { useFolders } from "@/context/foldersContext";

interface FolderProps {
  folder: FolderType;
  senders: SenderType[]; // Senders are now passed in directly
  expanded: boolean;
  toggleExpanded: (id: string) => void;
  activeFolder: string | null;
}

export default function Folder({
  folder,
  senders,
  expanded,
  toggleExpanded,
  activeFolder,
}: FolderProps) {
  const { deleteFolder, renameFolder, toggleReadFolder } = useFolders();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenamingModalOpen, setIsRenamingModalOpen] = useState(false);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [isMarkAsReadModalOpen, setIsMarkAsReadModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    console.log(`Muted notifications for ${folder.name}`);
  };

  return (
    <>
      <div>
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => toggleExpanded(folder.id)}
          className={`group px-md p-xs flex items-center justify-between rounded-md transition-colors cursor-pointer ${isFolderActive ? "bg-primary/10 text-primary" : "hover:bg-accent"
            }`}
        >
          <div className="flex items-center space-x-md flex-grow">
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
                    {/* Menu Items */}
                    <button className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary" onClick={handleMarkAsRead}>
                      <CheckIcon className="w-4 h-4" /> <span>{folder.isRead ? "Mark as unread" : "Mark as read"}</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary" onClick={handleMuteNotifications}>
                      <BellSlashIcon className="w-4 h-4" /> <span>Mute notifications</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary" onClick={handleRename}>
                      <PencilIcon className="w-4 h-4" /> <span>Rename</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary" onClick={handleDelete}>
                      <TrashIcon className="w-4 h-4" /> <span>Delete</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {folder.count}
            </span>
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
              {senders.length > 0 ? (
                <div className="ml-6 mt-1 space-y-1">
                  {senders.map((sender) => (
                    <Sender key={sender.id} sender={sender} />
                  ))}
                </div>
              ) : (
                <div className="ml-10 py-2 text-sm text-muted-foreground">
                  No senders in this folder
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <BasicModal
        isOpen={isRenamingModalOpen}
        onClose={() => setIsRenamingModalOpen(false)}
        onSave={(newName) => renameFolder(folder.id, newName)}
        initialValue={folder.name}
        title="Rename Folder"
      />
      <DeleteConfirmationModal
        isOpen={isDeletingModalOpen}
        onClose={() => setIsDeletingModalOpen(false)}
        onConfirm={() => {
          deleteFolder(folder.id);
          setIsDeletingModalOpen(false);
        }}
        showUnfollowOption={true}
        itemName={folder.name}
        itemType="folder"
      />
      <DeleteConfirmationModal
        isOpen={isMarkAsReadModalOpen}
        onClose={() => setIsMarkAsReadModalOpen(false)}
        onConfirm={() => {
          toggleReadFolder(folder.id, !folder.isRead)
          setIsMarkAsReadModalOpen(false)
        }}
        itemName={folder.name}
        itemType={folder.isRead ? "markasunread" : "markasread"}
      />
    </>
  );
}