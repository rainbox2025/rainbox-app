"use client";
import React, { useState, useEffect } from "react"; // Added useEffect
import { useBookmarks } from "@/context/bookmarkContext";
import { Edit3, RefreshCcw, Trash2 } from "lucide-react";
import {
  BookOpenIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  TagIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// Assuming your new/modified components are in a common UI directory
// Adjust these paths according to your project structure
import { BasicModal } from "@/components/modals/basic-modal";
import { DeleteConfirmationModal } from "@/components/modals/delete-modal";
import { DropdownMenu, DropdownItem } from "@/components/modals/dropdown-menu";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "../ui/skeleton";

const BookmarkSidebarContent = () => {
  const { bookmarks, bookmarkCount, allTags, renameTagGlobally,isLoading, deleteTagGlobally, isTagRenameLoading, isTagDeleteLoading, fetchAllData } = useBookmarks();

  const [activeTagMenu, setActiveTagMenu] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    tags: true,
  });

  // State for Rename Modal
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [tagToRename, setTagToRename] = useState<string | null>(null);

  // State for Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  // --- START: New code for responsive width ---
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // On mobile, set width to 80%. On desktop, set to 100% to fill the parent container.
  const containerStyle = isMobileView ? { width: '100%' } : { width: '100%' };
  // --- END: New code for responsive width ---

  const allBookmarksCount = bookmarks.length;
  const highlightsCount = bookmarks.filter((b) => b.text).length;
  const notesCount = bookmarks.filter(
    (b) => b.comment && b.comment.trim() !== ""
  ).length;

  const getTagCount = (tagName: string) => {
    return bookmarks.filter((b) =>
      b.tags?.map((t) => t.toLowerCase()).includes(tagName.toLowerCase())
    ).length;
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const openRenameModal = (tag: string) => {
    setTagToRename(tag);
    setIsRenameModalOpen(true);
    setActiveTagMenu(null);
  };

  const handleRenameTag = async (newTagName: string) => {
    if (
      tagToRename &&
      newTagName.trim() &&
      newTagName.trim().toLowerCase() !== tagToRename.toLowerCase()
    ) {
      await renameTagGlobally(tagToRename, newTagName.trim());
    }
    setTagToRename(null);
  };

  const openDeleteModal = (tag: string) => {
    setTagToDelete(tag);
    setIsDeleteModalOpen(true);
    setActiveTagMenu(null);
  };

  const handleDeleteTag = async () => {
    if (tagToDelete) {
      await deleteTagGlobally(tagToDelete);
    }
    setTagToDelete(null);
  };

  const getTagDropdownItems = (tag: string): DropdownItem[] => [
    {
      label: "Rename",
      icon: <Edit3 size={14} className="text-muted-foreground" />,
      onClick: () => openRenameModal(tag),
    },
    {
      label: "Delete",
      icon: <Trash2 size={14} />,
      onClick: () => openDeleteModal(tag),
      className: "text-destructive",
    },
  ];

    if (isLoading) {
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
    // Replaced fragment with a div and applied the new style
    <div style={containerStyle}>
      <div className="space-y-md h-full flex flex-col text-sm">
        <div className="px-4 h-header w-[99%] p-xs pr-2 flex items-center justify-between sticky top-0 z-10">
          <h3 className="font-medium text-sm text-muted-foreground">
            Bookmarks
          </h3>
           <button
                      className="p-xs rounded-full hover:bg-muted transition-colors"
                      onClick={async () => {
                        await fetchAllData();
                      }}
                      title="Refresh"
                    >
                      {isLoading ? (
                        <RefreshCcw className="w-4 h-4 text-muted-foreground animate-spin" />
                      ) : (
                        <RefreshCcw className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
        </div>

          <nav style={{minHeight: '50vh'}} className="space-y-sm p-sm pt-0 flex-grow overflow-y-auto custom-scrollbar">

          <a
            href="#"
            className="flex items-center space-x-md p-xs rounded-md hover:bg-hover text-foreground"
          >
            <BookOpenIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium truncate overflow-hidden overflow-ellipsis w-0 flex-1 mr-2 text-muted-foreground">
              All Bookmarks
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {bookmarkCount}
            </span>
          </a>

          <div className="pt-md">
            <button
              onClick={() => toggleSection("tags")}
              className="flex items-center justify-between w-full p-xs rounded-md hover:bg-hover text-muted-foreground focus:outline-none"
            >
              <div className="flex items-center space-x-md">
                <TagIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Tags</span>
              </div>
              <ChevronDownIcon
                className={`w-4 h-4 transform transition-transform duration-200 ${expandedSections.tags ? "rotate-0" : "-rotate-90"
                  }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.tags && (
                <motion.div
                  className="mt-xs space-y-px pl-md"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {allTags.length > 0 ? (
                    allTags.sort().map((tag) => (
                      <div
                        key={tag}
                        className="group flex items-center justify-between p-xs rounded-md hover:bg-accent"
                      >
                        <a
                          href="#"
                          className="flex-grow text-muted-foreground truncate group-hover:text-accent-foreground"
                        >
                          <span className="text-sm text-muted-foreground truncate overflow-hidden mr-1">
                            #
                          </span>
                          <span className="text-sm text-muted-foreground truncate overflow-hidden mr-1">
                            {tag}
                          </span>
                        </a>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTagMenu(
                                activeTagMenu === tag ? null : tag
                              );
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-muted-hover rounded"
                            title="Tag options"
                          >
                            <EllipsisHorizontalIcon className="w-4 h-4" />
                          </button>
                          <DropdownMenu
                            isOpen={activeTagMenu === tag}
                            onClose={() => setActiveTagMenu(null)}
                            items={getTagDropdownItems(tag)}
                            positionClasses="absolute right-0 top-full mt-1 z-30"
                            widthClass="w-36"
                          />
                        </div>
                        <span className="text-xs mx-1 text-muted-foreground font-medium">
                          {getTagCount(tag)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="p-xs text-xs text-muted-foreground">
                      No tags yet.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      {isRenameModalOpen && tagToRename && (
        <BasicModal
          isOpen={isRenameModalOpen}
          onClose={() => {
            setIsRenameModalOpen(false);
            setTagToRename(null);
          }}
          isLoading={isTagRenameLoading}
          onSave={handleRenameTag}
          initialValue={tagToRename}
          title="Rename Tag"
        />
      )}

      {isDeleteModalOpen && tagToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setTagToDelete(null);
          }}
          isLoading={isTagDeleteLoading}
          onConfirm={handleDeleteTag}
          itemName={tagToDelete}
          itemType="tag"
        />
      )}
    </div>
  );
};

export default BookmarkSidebarContent;