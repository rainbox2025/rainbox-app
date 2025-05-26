"use client";
import React, { useState } from 'react';
import { useBookmarks } from '@/context/bookmarkContext';
import { BookOpenIcon as SolidBookOpenIcon, PencilSquareIcon, DocumentTextIcon, TagIcon as SolidTagIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const BookmarkSidebarContent = () => {
  const { bookmarks, allTags, renameTagGlobally, deleteTagGlobally } = useBookmarks();
  const [activeTagMenu, setActiveTagMenu] = useState<string | null>(null); // For rename/delete options per tag
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    tags: true,
  });

  const allBookmarksCount = bookmarks.length;
  const highlightsCount = bookmarks.filter(b => b.text).length; // Assuming a bookmark is a highlight
  const notesCount = bookmarks.filter(b => b.comment && b.comment.trim() !== "").length;

  const getTagCount = (tagName: string) => {
    return bookmarks.filter(b => b.tags?.map(t => t.toLowerCase()).includes(tagName.toLowerCase())).length;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Basic Tag Rename/Delete (more complex logic needed for actual implementation)
  const handleRenameTag = (oldTag: string) => {
    const newTag = prompt(`Rename tag "${oldTag}" to:`, oldTag);
    if (newTag && newTag.trim() !== "" && newTag.trim().toLowerCase() !== oldTag.toLowerCase()) {
      renameTagGlobally(oldTag, newTag.trim());
      setActiveTagMenu(null);
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete the tag "${tagToDelete}" from all bookmarks? This cannot be undone.`)) {
      deleteTagGlobally(tagToDelete);
      setActiveTagMenu(null);
    }
  };


  return (
    <div className="p-md space-y-md h-full flex flex-col text-sm">
      <h1 className="text-xl font-semibold text-foreground px-xs mb-sm">Bookmarks</h1>

      <nav className="space-y-xs flex-grow overflow-y-auto custom-scrollbar">
        <a href="#" className="flex items-center space-x-md p-xs rounded-md hover:bg-hover text-foreground">
          <SolidBookOpenIcon className="w-5 h-5" />
          <span>All Bookmarks</span>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{allBookmarksCount}</span>
        </a>
        <a href="#" className="flex items-center space-x-md p-xs rounded-md hover:bg-hover text-muted-foreground">
          <PencilSquareIcon className="w-5 h-5" />
          <span>Highlights</span>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{highlightsCount}</span>
        </a>
        <a href="#" className="flex items-center space-x-md p-xs rounded-md hover:bg-hover text-muted-foreground">
          <DocumentTextIcon className="w-5 h-5" />
          <span>Notes</span>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{notesCount}</span>
        </a>

        <div className="pt-md">
          <button
            onClick={() => toggleSection('tags')}
            className="flex items-center justify-between w-full p-xs rounded-md hover:bg-hover text-muted-foreground focus:outline-none"
          >
            <div className="flex items-center space-x-md"><SolidTagIcon className="w-5 h-5" /><span>Tags</span></div>
            {expandedSections.tags ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
          </button>
          {expandedSections.tags && (
            <div className="mt-xs space-y-xs pl-md">
              {allTags.length > 0 ? allTags.sort().map(tag => (
                <div key={tag} className="group relative flex items-center justify-between">
                  <a href="#" className="flex-grow p-xs rounded-md hover:bg-hover text-muted-foreground truncate">
                    # {tag}
                  </a>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm mr-6">{getTagCount(tag)}</span>
                  <button
                    onClick={() => setActiveTagMenu(activeTagMenu === tag ? null : tag)}
                    className="p-1 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-muted-hover rounded absolute right-0 top-1/2 -translate-y-1/2"
                    title="Tag options"
                  >
                    <Edit3 size={14} className="text-muted-foreground" />
                  </button>
                  {activeTagMenu === tag && (
                    <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border shadow-lg rounded-md p-xs text-xs w-32">
                      <button onClick={() => handleRenameTag(tag)} className="w-full text-left p-1 hover:bg-hover rounded flex items-center gap-xs">
                        <Edit3 size={14} /> Rename
                      </button>
                      <button onClick={() => handleDeleteTag(tag)} className="w-full text-left p-1 hover:bg-hover rounded text-destructive flex items-center gap-xs">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )) : <p className="p-xs text-xs text-muted-foreground">No tags yet.</p>}
            </div>
          )}
        </div>
      </nav>
      {/* "Tag options" from image - this is now per-tag */}
    </div>
  );
};
export default BookmarkSidebarContent;