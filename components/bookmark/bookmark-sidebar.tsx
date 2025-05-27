"use client";
import React, { useState } from 'react';
import { useBookmarks } from '@/context/bookmarkContext';
import {
  BookOpenIcon as SolidBookOpenIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  TagIcon as SolidTagIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';
import { Edit3, Trash2 } from 'lucide-react';

// Assuming your new/modified components are in a common UI directory
// Adjust these paths according to your project structure
import { BasicModal } from '@/components/modals/basic-modal'; // Or your actual path e.g. '@/components/ui/BasicModal'
import { DeleteConfirmationModal } from '@/components/modals/delete-modal'; // Or e.g. '@/components/ui/DeleteConfirmationModal'
import { DropdownMenu, DropdownItem } from '@/components/modals/dropdown-menu'; // Or e.g. '@/components/ui/DropdownMenu'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

const BookmarkSidebarContent = () => {
  const { bookmarks, allTags, renameTagGlobally, deleteTagGlobally } = useBookmarks();

  const [activeTagMenu, setActiveTagMenu] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    tags: true,
  });

  // State for Rename Modal
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [tagToRename, setTagToRename] = useState<string | null>(null);

  // State for Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  const allBookmarksCount = bookmarks.length;
  const highlightsCount = bookmarks.filter(b => b.text).length;
  const notesCount = bookmarks.filter(b => b.comment && b.comment.trim() !== "").length;

  const getTagCount = (tagName: string) => {
    return bookmarks.filter(b => b.tags?.map(t => t.toLowerCase()).includes(tagName.toLowerCase())).length;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // --- Handlers for Rename ---
  const openRenameModal = (tag: string) => {
    setTagToRename(tag);
    setIsRenameModalOpen(true);
    setActiveTagMenu(null); // Close dropdown
  };

  const handleRenameTag = async (newTagName: string) => {
    if (tagToRename && newTagName.trim() && newTagName.trim().toLowerCase() !== tagToRename.toLowerCase()) {
      await renameTagGlobally(tagToRename, newTagName.trim());
    }
    // BasicModal's onSave will call this, BasicModal's onClose will handle closing.
    // We just need to reset our state if BasicModal doesn't do it via its own onClose.
    // setIsRenameModalOpen(false); // BasicModal should handle its own closing via its onClose prop
    setTagToRename(null);
  };

  // --- Handlers for Delete ---
  const openDeleteModal = (tag: string) => {
    setTagToDelete(tag);
    setIsDeleteModalOpen(true);
    setActiveTagMenu(null); // Close dropdown
  };

  const handleDeleteTag = async () => {
    if (tagToDelete) {
      await deleteTagGlobally(tagToDelete);
    }
    // DeleteConfirmationModal's onConfirm will call this.
    // setIsDeleteModalOpen(false); // Modal handles its own closing
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
      icon: <Trash2 size={14} />, // text-destructive class below will color it
      onClick: () => openDeleteModal(tag),
      className: "text-destructive",
    },
  ];

  return (
    <>
      <div className="space-y-md h-full flex flex-col text-sm">
        <div className="px-4 h-header w-[99%] p-xs pr-2 flex items-center justify-between sticky top-0 z-10">
          <h3 className="font-medium text-sm text-muted-foreground">Bookmarks</h3>
        </div>

        <nav className="space-y-sm p-sm pt-0 flex-grow overflow-y-auto custom-scrollbar">
          <a href="#" className="flex items-center space-x-md p-xs rounded-md hover:bg-hover text-foreground">
            <SolidBookOpenIcon className="w-5 h-5 text-muted-foreground" />
            <span className='text-sm font-medium truncate overflow-hidden overflow-ellipsis w-0 flex-1 mr-2 text-muted-foreground'>All Bookmarks</span>
            <span className="text-xs text-muted-foreground font-medium">{allBookmarksCount}</span>
          </a>
          <a href="#" className="flex items-center space-x-md p-xs rounded-md hover:bg-hover text-muted-foreground">
            <PencilSquareIcon className="w-5 h-5 text-muted-foreground" />
            <span className='text-sm font-medium truncate overflow-hidden overflow-ellipsis w-0 flex-1 mr-2 text-muted-foreground'>Highlights</span>
            <span className="text-xs text-muted-foreground font-medium">{highlightsCount}</span>
          </a>
          <a href="#" className="flex items-center space-x-md p-xs rounded-md hover:bg-hover text-muted-foreground">
            <DocumentTextIcon className="w-5 h-5 text-muted-foreground" />
            <span className='text-sm font-medium truncate overflow-hidden overflow-ellipsis w-0 flex-1 mr-2 text-muted-foreground'>Notes</span>
            <span className="text-xs text-muted-foreground font-medium">{notesCount}</span>
          </a>

          <div className="pt-md">
            <button
              onClick={() => toggleSection('tags')}
              className="flex items-center justify-between w-full p-xs rounded-md hover:bg-hover text-muted-foreground focus:outline-none"
            >
              <div className="flex items-center space-x-md "><SolidTagIcon className="w-5 h-5" /><span className='text-sm font-medium'>Tags</span></div>
              {expandedSections.tags ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </button>
            {expandedSections.tags && (
              <div className="mt-xs space-y-px pl-md"> {/* space-y-px for tighter list */}
                {allTags.length > 0 ? allTags.sort().map(tag => (
                  <div key={tag} className="group flex items-center justify-between p-xs rounded-md hover:bg-accent">
                    <a href="#" className="flex-grow  text-muted-foreground truncate group-hover:text-accent-foreground">
                      <span className='text-sm text-muted-foreground truncate overflow-hidden mr-1'>#</span>
                      <span className='text-sm text-muted-foreground truncate overflow-hidden mr-1'>{tag}</span>
                    </a>

                    <div className="relative"> {/* Wrapper for button and dropdown */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTagMenu(activeTagMenu === tag ? null : tag);
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
                        positionClasses="absolute right-0 top-full mt-1 z-30" // z-30, adjust if needed
                        widthClass="w-36" // Slightly narrower for "Rename/Delete"
                      />
                    </div>
                    <span className="text-xs mx-1 text-muted-foreground font-medium">
                      {getTagCount(tag)}
                    </span>
                  </div>
                )) : <p className="p-xs text-xs text-muted-foreground">No tags yet.</p>}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Rename Tag Modal */}
      {isRenameModalOpen && tagToRename && (
        <BasicModal
          isOpen={isRenameModalOpen}
          onClose={() => {
            setIsRenameModalOpen(false);
            setTagToRename(null);
          }}
          onSave={handleRenameTag} // BasicModal will provide the new value to this function
          initialValue={tagToRename}
          title="Rename Tag"
        />
      )}

      {/* Delete Tag Modal */}
      {isDeleteModalOpen && tagToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setTagToDelete(null);
          }}
          onConfirm={handleDeleteTag}
          itemName={tagToDelete}
          itemType="tag"
        />
      )}
    </>
  );
};

export default BookmarkSidebarContent;