import React from 'react';
import { ChevronLeft, Maximize2, Minimize2, Trash2, Tag, Edit2Icon } from 'lucide-react';
import { Bookmark as BookmarkType, useBookmarks } from '@/context/bookmarkContext';

interface Props {
  bookmark: BookmarkType;
  onClose: () => void;
  onBack?: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
}

const BookmarkReaderHeader: React.FC<Props> = ({ bookmark, onClose, onBack, isFullScreen, toggleFullScreen }) => {
  const { removeBookmark, showCommentModal, showTagModal } = useBookmarks();

  const handleBackOrClose = () => {
    if (window.innerWidth < 768 && onBack) onBack();
    else onClose();
  };

  const handleEditComment = (e: React.MouseEvent) => {
    const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    showCommentModal(bookmark.id, targetRect); // Position near the button
  };

  const handleEditTags = (e: React.MouseEvent) => {
    const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    showTagModal(bookmark.id, targetRect); // Position near the button
  };


  return (
    <div className="sticky top-0 z-20 bg-content h-header border-b border-border p-sm flex items-center justify-between gap-1">
      <div className="flex items-center gap-2">
        <button onClick={handleBackOrClose} className="p-xs rounded-full hover:bg-muted" title="Back">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={toggleFullScreen} className="p-xs rounded-full hover:bg-muted" title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}>
          {isFullScreen ? <Minimize2 className="w-4 h-4 text-muted-foreground" /> : <Maximize2 className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={handleEditComment} className="p-xs rounded-full hover:bg-muted" title="Edit/View Note">
          <Edit2Icon className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={handleEditTags} className="p-xs rounded-full hover:bg-muted" title="Edit Tags">
          <Tag className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => { if (window.confirm("Delete this bookmark?")) { removeBookmark(bookmark.id); onClose(); } }}
          className="p-xs rounded-full hover:bg-destructive/20 text-destructive"
          title="Delete Bookmark"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default BookmarkReaderHeader;