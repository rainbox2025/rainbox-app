import React from 'react';
import { Bookmark as BookmarkType } from '@/context/bookmarkContext';
import { BookmarkedItem } from './bookmarked-item';

interface Props {
  bookmarks: BookmarkType[];
  selectedBookmark: BookmarkType | null;
  onSelectBookmark: (bookmark: BookmarkType) => void;
}

export const BookmarkedItemsList: React.FC<Props> = ({ bookmarks, selectedBookmark, onSelectBookmark }) => {
  return (
    <div className="divide-y divide-border">
      <div className="h-header p-2">
        <h1 className='text-muted-foreground font-semibold text-md pl-3 truncate'>Bookmarks</h1>
      </div>
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