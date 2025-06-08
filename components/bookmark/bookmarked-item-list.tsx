// File: BookmarkedItemsList.tsx
import React from 'react';
import { Bookmark as BookmarkType } from '@/context/bookmarkContext';
import { BookmarkedItem } from './bookmarked-item';
import { Menu, X } from 'lucide-react';
import { useSidebar } from '@/context/sidebarContext';

interface Props {
  bookmarks: BookmarkType[];
  selectedBookmark: BookmarkType | null;
  onSelectBookmark: (bookmark: BookmarkType) => void;
}

export const BookmarkedItemsList: React.FC<Props> = ({ bookmarks, selectedBookmark, onSelectBookmark }) => {

  return (
    <div className=""> {/* Removed divide-y and divide-border */}
      {/* Add border-b to the header div if you want a line below it */}


      {bookmarks.map(bookmark => (
        <BookmarkedItem
          key={bookmark.id}
          bookmark={bookmark}
          isSelected={selectedBookmark?.id === bookmark.id}
          onSelect={() => onSelectBookmark(bookmark)}
        />
      ))}
      {bookmarks.length === 0 && (
        <div className="p-md text-center text-muted-foreground">No bookmarks to display.</div>
      )}
    </div>
  );
};