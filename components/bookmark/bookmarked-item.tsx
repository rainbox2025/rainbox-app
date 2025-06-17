"use client";

import React from 'react';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { Bookmark as BookmarkType, useBookmarks } from '@/context/bookmarkContext';
import { useMails } from '@/context/mailsContext';
import { useSenders } from '@/context/sendersContext';
import { SenderType } from '@/types/data';
import { Bookmark as BookmarkIconLucide } from 'lucide-react';
import { ChatBubbleBottomCenterIcon, TagIcon } from '@heroicons/react/24/outline';

interface Props {
  bookmark: BookmarkType;
  isSelected: boolean;
  onSelect: () => void;
}

export const BookmarkedItem: React.FC<Props> = ({ bookmark, isSelected, onSelect }) => {
  const { mails } = useMails();
  const { senders } = useSenders();
  const { showCommentModal, showTagModal, removeBookmark } = useBookmarks();

  const mailObject = bookmark.mailId ? mails.find(m => m.id === bookmark.mailId) : null;

  let resolvedSender: SenderType | null | undefined = null;
  if (mailObject) {
    if (mailObject.sender) {
      resolvedSender = mailObject.sender;
    } else if (mailObject.sender_id) {
      resolvedSender = senders.find(s => s.id === mailObject.sender_id);
    }
  }

  const title = mailObject?.subject || bookmark.text.substring(0, 70) + (bookmark.text.length > 70 ? '...' : '');
  const mailSenderName = resolvedSender?.name || (mailObject ? "Unknown Sender" : "Web Highlight");
  const mailSenderDomain = resolvedSender?.domain;

  const handleCommentClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    showCommentModal(bookmark.id, buttonRect);
  };

  const handleTagsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    showTagModal(bookmark.id, buttonRect);
  };

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
      <div className="absolute bottom-2 right-4 flex items-center z-10 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {bookmark.comment && (
          <button
            className="p-xs rounded-full hover:bg-accent hover:text-foreground transition-colors text-muted-foreground"
            onClick={handleCommentClick}
            title="View/Edit Comment"
          >
            <ChatBubbleBottomCenterIcon className="w-4 h-4" />
          </button>
        )}
        {(bookmark.tags && bookmark.tags.length > 0) && (
          <button
            className="p-xs rounded-full hover:bg-accent hover:text-foreground transition-colors text-muted-foreground"
            onClick={handleTagsClick}
            title="View/Edit Tags"
          >
            <TagIcon className="w-4 h-4" />
          </button>
        )}
        <button
          className="p-xs rounded-full hover:bg-accent hover:text-foreground transition-colors text-muted-foreground"
          onClick={handleRemoveBookmarkClick}
          title="Remove Bookmark"
        >
          <BookmarkIconLucide className="w-4 h-4" />
        </button>
      </div>

      <div className="pr-16">
        <h2
          className={cn(
            "line-clamp-2 mb-1 text-base min-h-[2.5rem] font-bold",
            !isSelected && "text-muted-foreground"
          )}
        >
          {title}
        </h2>
        <div
          className={cn(
            "flex flex-row items-center text-sm",
            !isSelected && "text-muted-foreground"
          )}
        >
          {mailSenderDomain ? (
            <img
              src={
                mailSenderDomain === "gmail.com"
                  ? "/gmail.webp"
                  : `https://www.google.com/s2/favicons?domain=${mailSenderDomain}&sz=128`
              }
              alt={mailSenderName}
              className="w-4 h-4 object-cover mr-2"
            />
          ) : !mailObject && bookmark.text ? (
            <BookmarkIconLucide className="w-4 h-4 object-cover mr-2 text-muted-foreground" />
          ) : null
          }
          <span className="mr-2">{mailSenderName}</span>
          <span className="text-xs text-muted-foreground">
            {moment(bookmark.createdAt).fromNow()}
          </span>
        </div>
      </div>
    </div>
  );
};