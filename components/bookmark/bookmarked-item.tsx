"use client";

import React from 'react';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { Bookmark as BookmarkType, useBookmarks } from '@/context/bookmarkContext';
import { useMails } from '@/context/mailsContext';
import { useSenders } from '@/context/sendersContext';
import { SenderType } from '@/types/data'; // Assuming SenderType is exported from here
import { MessageSquareText, Tags, Bookmark as BookmarkIconLucide } from 'lucide-react';

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
    // Prioritize sender object directly attached to the mail item if available
    if (mailObject.sender) {
      resolvedSender = mailObject.sender;
    } else if (mailObject.sender_id) {
      // Fallback to looking up sender_id in the global senders list
      resolvedSender = senders.find(s => s.id === mailObject.sender_id);
    }
  }

  const title = mailObject?.subject || bookmark.text.substring(0, 70) + (bookmark.text.length > 70 ? '...' : '');

  // Determine sender name and domain, with fallbacks
  const mailSenderName = resolvedSender?.name || (mailObject ? "Unknown Sender" : "Web Highlight");
  const mailSenderDomain = resolvedSender?.domain; // Will be undefined if not a mail or sender has no domain

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

  const handleToggleBookmarkClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    removeBookmark(bookmark.id); // "Toggle" for an existing bookmark means removing it
  };

  return (
    <div
      key={bookmark.id}
      onClick={onSelect}
      className={cn(
        // This line is responsible for the default bottom border
        "flex flex-col border-b right-[-3px] w-[99%] border-border p-sm px-md cursor-pointer relative group",
        isSelected && "bg-blue-300/20 border-[1.5px] rounded-md border-blue-300 ",
      )}
    >
      {/* Hover Action Buttons: comment, tags, bookmark toggle (unbookmark) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-4 flex z-10">
        <button
          className="p-xs rounded-full hover:bg-accent hover:text-foreground transition-colors"
          onClick={handleCommentClick}
          title="Add/Edit Comment"
        >
          <MessageSquareText className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          className="p-xs rounded-full hover:bg-accent hover:text-foreground transition-colors"
          onClick={handleTagsClick}
          title="Manage Tags"
        >
          <Tags className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          className="p-xs rounded-full hover:bg-accent hover:text-foreground transition-colors"
          onClick={handleToggleBookmarkClick}
          title="Remove Bookmark" // This item is a bookmark, so toggle means remove
        >
          <BookmarkIconLucide
            fill="currentColor" // Filled, as it's currently bookmarked
            className="w-4 h-4 text-muted-foreground"
          />
        </button>
      </div>

      {/* Content Area: Mimics MailItem structure */}
      <div className="pr-12"> {/* Padding to avoid overlap with absolute positioned hover buttons */}
        <h2
          className={cn(
            "line-clamp-2 mb-1 text-base min-h-[2.5rem] font-bold", // Base style from MailItem
            !isSelected && "text-muted-foreground" // If not selected, mute title (similar to a "read" mail)
          )}
        >
          {title}
        </h2>
        <div
          className={cn(
            "flex flex-row items-center text-sm", // Base style from MailItem
            !isSelected && "text-muted-foreground" // If not selected, mute meta text (similar to a "read" mail)
          )}
        >
          {mailSenderDomain ? ( // If it's an email with a known domain, show favicon
            <img
              src={
                mailSenderDomain === "gmail.com"
                  ? "/gmail.webp" // Ensure this path is correct
                  : `https://www.google.com/s2/favicons?domain=${mailSenderDomain}&sz=128`
              }
              alt={mailSenderName}
              className="w-4 h-4 object-cover mr-2"
            />
          ) : !mailObject && bookmark.text ? ( // If not an email (e.g., web highlight), show generic bookmark icon
            <BookmarkIconLucide className="w-4 h-4 object-cover mr-2 text-muted-foreground" />
          ) : null /* No icon if it's an email but domain is unknown, or other cases */
          }
          <span className="mr-2">{mailSenderName}</span>
          <span className="text-xs text-muted-foreground"> {/* Date is always muted */}
            {moment(bookmark.createdAt).fromNow()}
          </span>
        </div>
      </div>
    </div>
  );
};