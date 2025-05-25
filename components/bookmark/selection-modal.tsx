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
    showCommentModal,
    showTagModal // <<< New: Get showTagModal from context
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

      if (popupHeight === 0) popupHeight = 50; // Default height estimate
      if (popupWidth === 0) popupWidth = 200; // Default width estimate


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
        // If popup overflows top (e.g. selection is very high), position below selection
        if (top < scrollY + viewportMargin && selectionViewportRect.bottom + popupHeight + 10 < scrollY + window.innerHeight - viewportMargin) {
          top = scrollY + selectionViewportRect.bottom + 10;
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

      let left = (selectionViewportRect.left - offsetParentRect.top) +
        offsetParentEl.scrollLeft +
        (selectionViewportRect.width / 2) -
        (popupWidth / 2);

      const marginFromOffsetParentEdge = 8;

      left = Math.max(marginFromOffsetParentEdge, left);

      if (left + popupWidth > offsetParentEl.clientWidth - marginFromOffsetParentEdge) {
        left = offsetParentEl.clientWidth - popupWidth - marginFromOffsetParentEdge;
      }
      // If popup overflows top, position below selection if space allows
      if (top < offsetParentEl.scrollTop + marginFromOffsetParentEdge &&
        (selectionViewportRect.bottom - offsetParentRect.top) + offsetParentEl.scrollTop + popupHeight + 10 < offsetParentEl.scrollTop + offsetParentEl.clientHeight - marginFromOffsetParentEdge) {
        top = (selectionViewportRect.bottom - offsetParentRect.top) + offsetParentEl.scrollTop + 10;
      }
      top = Math.max(offsetParentEl.scrollTop + marginFromOffsetParentEdge, top);


      setPopupStyle({
        top: `${top}px`,
        left: `${left}px`,
        position: 'absolute',
        zIndex: 1000,
      });
    }
  }, [activePopup]);

  useEffect(() => {
    // This handler is general and might be for icons not directly managed by MailBodyViewer.
    // Clicks on icons within highlights are handled by MailBodyViewer and should stop propagation.
    const handler = (e: MouseEvent) => {
      // const target = e.target as Element;
      // Example: if you had other comment icons with class 'some-other-comment-icon'
      // const icon = target.closest('.some-other-comment-icon');
      // if (icon) { ... }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        const targetElement = event.target as HTMLElement;
        if (
          !targetElement.closest('.bookmark-highlight') &&
          !targetElement.closest('.comment-modal-root-class') &&
          !targetElement.closest('.tag-modal-root-class')
        ) {
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

  const handleCommentClick = () => {
    if (activePopup) {
      showCommentModal(activePopup.bookmarkId, activePopup.rect);
    }
  };

  // New: Handler for the tag button
  const handleTagClick = () => {
    if (activePopup) {
      showTagModal(activePopup.bookmarkId, activePopup.rect);
    }
  };

  const iconButtonClass = "p-2 rounded-full hover:bg-hovered transition-colors text-muted-foreground";

  return (
    <div
      ref={popupRef}
      style={popupStyle}
      className="bg-sidebar text-sm border border-hovered rounded-full shadow-xl flex items-center space-x-1 p-1 selection-popup-class-name" // Added class
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={handleCancel} title="Remove bookmark" className={`${iconButtonClass}`}>
        <XCircleIcon className="h-6 w-6 text-red-400 " />
      </button>
      <button onClick={handleCommentClick} title="Add/Edit comment" className={iconButtonClass}>
        <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
      </button>
      <button onClick={handleTagClick} title="Add/Edit tags" className={iconButtonClass}>
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