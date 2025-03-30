import { Feed } from "@/types/data";
import { useSortable } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from 'framer-motion';
import { CSS } from '@dnd-kit/utilities';
import { FeedIcon } from "./FeedIcon";
import { useState, useRef, useEffect } from 'react';
import { BellSlashIcon, CheckIcon, EllipsisHorizontalIcon, FolderIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { DeleteConfirmationModal } from "./DeleteModal";
import { Modal } from "./Modal";
import { useSenders } from "@/context/sendersContext";

interface SenderProps {
  feed: Feed;
  onRenameFeed?: (feedId: string, newName: string) => void;
  onUnfollowFeed?: (feedId: string) => void;
}

export default function Sender({
  feed,
  onRenameFeed,
  onUnfollowFeed
}: SenderProps) {
  const { renameSender } = useSenders();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `feed-${feed.id}`,
    data: {
      type: 'feed',
      feed
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsRenaming(true);
  };

  const handleRenameComplete = (newName: string) => {
    if (newName.trim() && newName !== feed.name) {
      if (onRenameFeed) {
        onRenameFeed(feed.id, newName);
      } else {
        renameSender(feed.id, newName);
      }
    }

    setIsRenaming(false);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    // Add your mark as read logic here
    console.log(`Marked ${feed.name} as read`);
  };

  const handleMoveToFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    // Add your move to folder logic here
    console.log(`Move ${feed.name} to folder`);
  };

  const handleMuteNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    // Add your mute notifications logic here
    console.log(`Muted notifications for ${feed.name}`);
  };

  const handleUnfollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsUnfollowModalOpen(true);
  };

  const confirmUnfollow = () => {
    if (onUnfollowFeed) {
      onUnfollowFeed(feed.id);
    } else {
      console.log(`Unfollowed ${feed.name}`);
    }
    setIsUnfollowModalOpen(false);
  };

  const cancelUnfollow = () => {
    setIsUnfollowModalOpen(false);
  };

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group p-xs px-md flex items-center justify-between rounded-md cursor-grab 
    ${isDragging
            ? 'bg-secondary/30 dark:bg-secondary/50 text-foreground dark:text-foreground shadow-sm z-10'
            : 'hover:bg-accent'}`}
      >
        <div className="flex items-center space-x-md overflow-hidden flex-1">
          <FeedIcon feed={feed} />
          <span className="text-sm text-foreground truncate overflow-hidden mr-2">
            {feed.name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="p-xs text-muted-foreground hover:cursor-pointer rounded-full transition-all duration-350 ease-in-out opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground"
            >
              <EllipsisHorizontalIcon className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-8 w-48 bg-popover text-popover-foreground rounded-md shadow-lg py-1 z-20 border border-border"
                >
                  <button
                    className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-300 ease-in-out hover:cursor-pointer"
                    onClick={handleMarkAsRead}
                  >
                    <CheckIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Mark as read</span>
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-300 ease-in-out hover:cursor-pointer"
                    onClick={handleRename}
                  >
                    <PencilIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Rename</span>
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-300 ease-in-out hover:cursor-pointer"
                    onClick={handleMoveToFolder}
                  >
                    <FolderIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Move to folder</span>
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary transition-all duration-300 ease-in-out hover:cursor-pointer"
                    onClick={handleMuteNotifications}
                  >
                    <BellSlashIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Mute notifications</span>
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm flex items-center space-x-2 hover:bg-secondary  transition-all duration-300 ease-in-out hover:cursor-pointer"
                    onClick={handleUnfollow}
                  >
                    <TrashIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Unfollow</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            {feed.count >= 1000 ? `${Math.floor(feed.count / 1000)}K+` : feed.count}
          </span>
        </div>
      </motion.div>

      <DeleteConfirmationModal
        isOpen={isUnfollowModalOpen}
        onClose={cancelUnfollow}
        onConfirm={confirmUnfollow}
        itemName={feed.name}
        itemType="feed"
      />

      {/* Rename Modal */}
      <Modal
        isOpen={isRenaming}
        onClose={() => setIsRenaming(false)}
        onSave={handleRenameComplete}
        initialValue={feed.name}
        title="Rename Category"
      />
    </>
  );
}