"use client";

import React from 'react';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { Bookmark as BookmarkType, useBookmarks } from '@/context/bookmarkContext';
import { useMails } from '@/context/mailsContext';
import { useSenders } from '@/context/sendersContext';
import { Bookmark as BookmarkIconLucide } from 'lucide-react';
import { SenderIcon } from '@/components/sidebar/sender-icon';

const formatRelativeTime = (date: string | number): string => {
  const dateMoment = moment(date);
  const now = moment();
  const seconds = now.diff(dateMoment, "seconds");
  if (seconds < 60) return `${seconds}s`;
  const minutes = now.diff(dateMoment, "minutes");
  if (minutes < 60) return `${minutes}m`;
  const hours = now.diff(dateMoment, "hours");
  if (hours < 24) return `${hours}h`;
  const days = now.diff(dateMoment, "days");
  if (days < 7) return `${days}d`;
  const weeks = now.diff(dateMoment, "weeks");
  return `${weeks}w`;
};

interface Props {
  bookmark: BookmarkType; 
  isSelected: boolean;
  onSelect: () => void;
}

export const BookmarkedItem: React.FC<Props> = ({ bookmark, isSelected, onSelect }) => {
  const { mails } = useMails();
  const { senders } = useSenders();
  const { removeBookmark } = useBookmarks();

  
  const mailObject = bookmark.mailId ? mails.find(m => m.id === bookmark.mailId) : null;
  const resolvedSender = mailObject ? senders.find(s => s.id === mailObject.sender_id) : null;

  
  const title = mailObject?.subject || "Bookmarked Email";
  const mailSenderName = resolvedSender?.name || "Unknown Sender";

  
  
  
  const handleRemoveBookmarkClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    removeBookmark(bookmark.id);
  };

  return (
    <div
      key={bookmark.id}
      onClick={onSelect}
      className={cn(
        "flex flex-col border-b right-[-3px] w-[99%] border-border p-sm px-md cursor-pointer relative group",
        isSelected && "bg-blue-300/20 border-[1.5px] rounded-md border-blue-300",
      )}
    >
      <div className="absolute bottom-2 right-1 flex items-center z-10 space-x-1 opacity-100">
        <button
          className="p-xs rounded-full hover:bg-accent hover:text-foreground transition-colors text-muted-foreground"
          onClick={handleRemoveBookmarkClick}
          title="Remove Bookmark"
        >
          <BookmarkIconLucide
            fill="currentColor"
            className="w-4 h-4"
          />
        </button>
      </div>

      <div className="pr-12">
        <h2
          className={cn(
            "line-clamp-2 mb-1 text-base min-h-[2.5rem] font-bold",
            !isSelected && "text-muted-foreground/80"
          )}
        >
          {title}
        </h2>
        <div className={cn(
          "flex w-full items-center justify-start gap-x-2 text-sm",
          !isSelected && "text-muted-foreground"
        )}>
          <div className="flex min-w-0 items-center gap-x-2">
            {resolvedSender ? (
              <SenderIcon sender={resolvedSender} />
            ) : (
              <BookmarkIconLucide className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}
            <p className="truncate">
              {mailSenderName}
            </p>
          </div>
          {bookmark.createdAt !== undefined && (
            <p className="flex-shrink-0 whitespace-nowrap text-xs text-muted-foreground">
              {formatRelativeTime(bookmark.createdAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};