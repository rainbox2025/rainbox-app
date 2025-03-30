import { FolderType, SenderType } from "@/types/data";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from 'framer-motion';
import { CSS } from '@dnd-kit/utilities';
import { BellSlashIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, EllipsisHorizontalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import SenderComponent from "./Sender";
import { Modal } from "./Modal";
import { useState, useRef, useEffect } from 'react';
import { DeleteConfirmationModal } from "./DeleteModal";
import { useFolders } from "@/context/foldersContext";

interface FolderProps {
  folder: FolderType;
  expanded: boolean;
  toggleExpanded: (id: string) => void;
  senders: SenderType[];
  activeFolder: string | null;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMarkFolderAsRead?: (folderId: string) => void;
}

export default function Folder({
  folder,
  expanded,
  toggleExpanded,
  senders,
  activeFolder,
  onRenameFolder,
  onDeleteFolder,
  onMarkFolderAsRead
}: FolderProps) {
  const { deleteFolder, renameFolder } = useFolders();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenamingModalOpen, setIsRenamingModalOpen] = useState(false);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [isMarkAsReadModalOpen, setIsMarkAsReadModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `folder-${folder.id}`,
    data: {
      type: 'folder',
      folder
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const senderIds = senders.map(sender => `sender-${sender.id}`);
  const isFolderActive = activeFolder === folder.id;

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
    // Add your mute notifications logic here
    console.log(`Muted notifications for ${folder.name}`);
  };

  const confirmMarkAsRead = () => {
    onMarkFolderAsRead?.(folder.id);
    setIsMarkAsReadModalOpen(false);
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className={`mb-0 ${isDragging ? 'z-10' : ''}`}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => toggleExpanded(folder.id)}
          className={`group px-md p-xs flex items-center justify-between rounded-md transition-colors cursor-pointer
    ${isFolderActive
              ? 'bg-primary/10 text-primary'
              : isDragging
                ? 'bg-secondary'
                : 'hover:bg-accent'}`}
          {...attributes}
          {...listeners}
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
                      onClick={handleMuteNotifications}
                    >
                      <BellSlashIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Mute notifications</span>
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
                      onClick={handleDelete}
                    >
                      <TrashIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Delete</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {folder.count >= 1000 ? `${Math.floor(folder.count / 1000)}K+` : folder.count}
            </span>
          </div>
        </motion.div>

        {/* Senders for this folder with animation */}
        <AnimatePresence>
          {expanded && senders.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="ml-6 mt-1.25 space-y-md-1.25"
            >
              <SortableContext items={senderIds} strategy={verticalListSortingStrategy}>
                {senders.map((sender) => (
                  <SenderComponent key={sender.id} sender={sender} />
                ))}
              </SortableContext>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rename Modal */}
      <Modal
        isOpen={isRenamingModalOpen}
        onClose={() => setIsRenamingModalOpen(false)}
        onSave={(newName) => {
          console.log("in modal, name is", newName);
          renameFolder(folder.id, newName)
        }}
        initialValue={folder.name}
        title="Rename Folder"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeletingModalOpen}
        onClose={() => setIsDeletingModalOpen(false)}
        onConfirm={() => { setIsDeletingModalOpen(false); deleteFolder(folder.id) }}
        itemName={folder.name}
        itemType="folder"
      />

      {/* Mark as Read Confirmation Modal */}
      {/* <Modal
        isOpen={isMarkAsReadModalOpen}
        onClose={() => setIsMarkAsReadModalOpen(false)}
        onSave={confirmMarkAsRead}
        initialName="Mark all items in this folder as read?"
        title="Mark Folder as Read"
      /> */}
    </>
  );
}