import { SenderType } from "@/types/data";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckIcon,
  PencilIcon,
  FolderIcon,
  BellSlashIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useRef, useEffect } from "react";

interface SenderDropdownMenuProps {
  sender: SenderType;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (e: React.MouseEvent) => void;
  onRename: (e: React.MouseEvent) => void;
  onMoveToFolder: (e: React.MouseEvent) => void;
  onMuteNotifications: (e: React.MouseEvent) => void;
  onUnfollow: (e: React.MouseEvent) => void;
}

export const SenderDropdownMenu = ({
  sender,
  isOpen,
  onClose,
  onMarkAsRead,
  onRename,
  onMoveToFolder,
  onMuteNotifications,
  onUnfollow,
}: SenderDropdownMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-8 w-48 bg-popover text-popover-foreground rounded-md shadow-lg py-1 z-20 border border-border"
        >
          <button
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-300 ease-in-out hover:cursor-pointer"
            onClick={onMarkAsRead}
          >
            <CheckIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {sender.isRead ? "Mark as unread" : "Mark as read"}
            </span>
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-300 ease-in-out hover:cursor-pointer"
            onClick={onRename}
          >
            <PencilIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Rename</span>
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-300 ease-in-out hover:cursor-pointer"
            onClick={onMoveToFolder}
          >
            <FolderIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Move to folder</span>
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-300 ease-in-out hover:cursor-pointer"
            onClick={onMuteNotifications}
          >
            <BellSlashIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Mute notifications</span>
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-300 ease-in-out hover:cursor-pointer"
            onClick={onUnfollow}
          >
            <TrashIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Unfollow</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};