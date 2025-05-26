import React from 'react';
import { Bookmark as BookmarkType } from '@/context/bookmarkContext';
import { cn } from '@/lib/utils';
import { MessageSquareText, SquarePen, Flag } from 'lucide-react'; // Updated icons
import { useMails } from '@/context/mailsContext'; // To get mail subject

interface Props {
  bookmark: BookmarkType;
  isSelected: boolean;
  onSelect: () => void;
}

export const BookmarkedItem: React.FC<Props> = ({ bookmark, isSelected, onSelect }) => {
  const { mails } = useMails();
  const mail = bookmark.mailId ? mails.find(m => m.id === bookmark.mailId) : null;

  const title = mail?.subject || bookmark.text.substring(0, 70) + (bookmark.text.length > 70 ? '...' : '');
  const source = mail ? mail.subject || "Email Source" : "Web Highlight"; // Placeholder

  // The icons in the image: "2 yellow boxes", "4 lines", "bookmark flag"
  // Let's interpret: "yellow boxes" = number of highlights (this IS a highlight, so maybe related data?)
  // "4 lines" = number of notes (this bookmark has ONE comment/note)
  // "bookmark flag" = this item is bookmarked (it is, by definition)

  // For simplicity, let's use:
  // - SquarePen for "highlight" (as this item is one)
  // - MessageSquareText for "note" if comment exists
  // - Flag for "bookmarked status" (always present here)

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex flex-col p-sm px-md cursor-pointer group hover:bg-hover border-l-2 border-transparent",
        isSelected && "bg-primary/10 border-l-primary"
      )}
    >
      <h2 className={cn("line-clamp-2 mb-1 text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>
        {title}
      </h2>
      <p className="text-xs text-muted-foreground mb-xs line-clamp-1">{source}</p>

      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="mt-xs flex flex-wrap gap-xs">
          {bookmark.tags.map(tag => (
            <span key={tag} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};