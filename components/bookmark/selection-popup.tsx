"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useBookmarks } from '@/context/bookmarkContext'; // Adjust path
import {
  XCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  TagIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';

const SelectionPopup: React.FC = () => {
  const {
    activePopup,
    hidePopup,
    removeBookmark,
    getBookmarkById,
    showCommentModal // New: Get showCommentModal from context
  } = useBookmarks();

  const popupRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activePopup && popupRef.current) {
      const { rect: selectionViewportRect } = activePopup;
      const popupElement = popupRef.current;

      let popupHeight = popupElement.offsetHeight;
      let popupWidth = popupElement.offsetWidth;

      if (popupHeight === 0) popupHeight = 50;
      if (popupWidth === 0) popupWidth = 200;

      const offsetParentEl = popupElement.offsetParent as HTMLElement | null;

      if (!offsetParentEl) {
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        let top = scrollY + selectionViewportRect.top - popupHeight - 10;
        let left = scrollX + selectionViewportRect.left + selectionViewportRect.width / 2 - popupWidth / 2;

        const viewportMargin = 8;
        top = Math.max(scrollY + viewportMargin, top);
        left = Math.max(scrollX + viewportMargin, left);
        if (left + popupWidth > scrollX + window.innerWidth - viewportMargin) {
          left = scrollX + window.innerWidth - popupWidth - viewportMargin;
        }

        setPopupStyle({
          top: `${top}px`,
          left: `${left}px`,
          position: 'absolute',
          zIndex: 1000,
        });
        return;
      }

      const offsetParentRect = offsetParentEl.getBoundingClientRect();

      let top = (selectionViewportRect.top - offsetParentRect.top) +
        offsetParentEl.scrollTop -
        popupHeight -
        10;

      let left = (selectionViewportRect.left - offsetParentRect.left) +
        offsetParentEl.scrollLeft +
        (selectionViewportRect.width / 2) -
        (popupWidth / 2);

      const marginFromOffsetParentEdge = 8;

      top = Math.max(marginFromOffsetParentEdge, top);
      left = Math.max(marginFromOffsetParentEdge, left);

      if (left + popupWidth > offsetParentEl.clientWidth - marginFromOffsetParentEdge) {
        left = offsetParentEl.clientWidth - popupWidth - marginFromOffsetParentEdge;
      }
      // If popup overflows top (e.g. selection is very high), position below selection
      if (top < marginFromOffsetParentEdge + offsetParentEl.scrollTop) {
        top = (selectionViewportRect.bottom - offsetParentRect.top) + offsetParentEl.scrollTop + 10;
      }


      setPopupStyle({
        top: `${top}px`,
        left: `${left}px`,
        position: 'absolute',
        zIndex: 1000,
      });
    }
  }, [activePopup]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      console.log('clicked comment')
      const target = e.target as Element;
      const icon = target.closest('.comment-icon');
      if (icon) {
        const bookmarkId = icon.getAttribute('data-bookmark-id');
        const rect = icon.getBoundingClientRect();
        showCommentModal(bookmarkId!, rect);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        const targetElement = event.target as HTMLElement;
        if (!targetElement.closest('.bookmark-highlight')) {
          hidePopup();
        }
      }
    };




    document.addEventListener('click', handler);
    if (activePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopup, hidePopup]);

  if (!activePopup) return null;

  const bookmark = getBookmarkById(activePopup.bookmarkId);
  if (!bookmark) return null;

  const handleCancel = () => {
    removeBookmark(bookmark.id);
    // hidePopup(); // removeBookmark will hide it if active
  };

  const handleCopy = async () => {
    if (bookmark.text) {
      try {
        await navigator.clipboard.writeText(bookmark.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text.');
      }
    }
  };

  // New: Handler for the comment button
  const handleCommentClick = () => {
    if (activePopup) {
      showCommentModal(activePopup.bookmarkId, activePopup.rect);
      // hidePopup(); // showCommentModal now handles hiding the selection popup
    }
  };

  const iconButtonClass = "p-2 rounded-full hover:bg-hovered transition-colors text-muted-foreground";

  return (
    <div
      ref={popupRef}
      style={popupStyle}
      className="bg-sidebar text-sm border border-hovered rounded-full shadow-xl flex items-center space-x-1 p-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={handleCancel} title="Remove bookmark" className={`${iconButtonClass}`}>
        <XCircleIcon className="h-6 w-6 text-red-400 " />
      </button>
      {/* Updated onClick for comment button */}
      <button onClick={handleCommentClick} title="Add/Edit comment" className={iconButtonClass}>
        <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
      </button>
      <button onClick={() => alert('Add tags (not implemented)')} title="Add tags" className={iconButtonClass}>
        <TagIcon className="h-5 w-5" />
      </button>
      <button onClick={handleCopy} title={copied ? "Copied!" : "Copy text"} className={`${iconButtonClass} ${copied ? 'text-green-400' : ''}`}>
        <ClipboardDocumentIcon className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {copied && (
          <motion.div
            className="absolute right-0 top-full mt-2 bg-sidebar text-popover-foreground px-2 py-1 rounded text-xs shadow-md z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            Copied
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectionPopup;