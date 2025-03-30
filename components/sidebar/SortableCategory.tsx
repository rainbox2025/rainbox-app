import { Category, Feed } from "@/types/data";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from 'framer-motion';
import { CSS } from '@dnd-kit/utilities';
import { BellSlashIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, EllipsisHorizontalIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import SortableFeed from "./SortableFeed";
import { FolderModal } from "./FolderModal";
import { useState, useRef, useEffect } from 'react';
import { DeleteConfirmationModal } from "./DeleteModal";
import { useFolders } from "@/context/foldersContext";

interface SortableCategoryProps {
  category: Category;
  expanded: boolean;
  toggleExpanded: (id: string) => void;
  feeds: Feed[];
  activeCategory: string | null;
  onRenameCategory: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onMarkCategoryAsRead?: (categoryId: string) => void;
}

export default function SortableCategory({
  category,
  expanded,
  toggleExpanded,
  feeds,
  activeCategory,
  onRenameCategory,
  onDeleteCategory,
  onMarkCategoryAsRead
}: SortableCategoryProps) {
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
    id: `category-${category.id}`,
    data: {
      type: 'category',
      category
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const feedIds = feeds.map(feed => `feed-${feed.id}`);
  const isCategoryActive = activeCategory === category.id;

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
    console.log(`Muted notifications for ${category.name}`);
  };

  const confirmMarkAsRead = () => {
    onMarkCategoryAsRead?.(category.id);
    setIsMarkAsReadModalOpen(false);
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className={`mb-0 ${isDragging ? 'z-10' : ''}`}>
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => toggleExpanded(category.id)}
          className={`group px-md p-xs flex items-center justify-between rounded-md transition-colors cursor-pointer
    ${isCategoryActive
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
              {category.name}
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
              {category.count >= 1000 ? `${Math.floor(category.count / 1000)}K+` : category.count}
            </span>
          </div>
        </motion.div>

        {/* Feeds for this category with animation */}
        <AnimatePresence>
          {expanded && feeds.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="ml-6 mt-1.25 space-y-md-1.25"
            >
              <SortableContext items={feedIds} strategy={verticalListSortingStrategy}>
                {feeds.map((feed) => (
                  <SortableFeed key={feed.id} feed={feed} />
                ))}
              </SortableContext>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rename Modal */}
      <FolderModal
        isOpen={isRenamingModalOpen}
        onClose={() => setIsRenamingModalOpen(false)}
        onSave={(newName) => renameFolder(category.id, newName)}
        initialValue={category.name}
        title="Rename Category"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeletingModalOpen}
        onClose={() => setIsDeletingModalOpen(false)}
        onConfirm={() => { setIsDeletingModalOpen(false); deleteFolder(category.id) }}
        itemName={category.name}
        itemType="category"
      />

      {/* Mark as Read Confirmation Modal */}
      {/* <FolderModal
        isOpen={isMarkAsReadModalOpen}
        onClose={() => setIsMarkAsReadModalOpen(false)}
        onSave={confirmMarkAsRead}
        initialName="Mark all items in this category as read?"
        title="Mark Category as Read"
      /> */}
    </>
  );
}