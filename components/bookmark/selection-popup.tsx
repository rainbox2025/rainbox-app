"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useBookmarks } from '@/context/bookmarkContext';
import {
  XCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  TagIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';

const SelectionPopup: React.FC = () => {
  const { activePopup, hidePopup, removeBookmark, getBookmarkById } = useBookmarks();
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activePopup && popupRef.current) {
      const { rect: selectionViewportRect } = activePopup; // This is from range.getBoundingClientRect(), so viewport-relative
      const popupElement = popupRef.current;

      let popupHeight = popupElement.offsetHeight;
      let popupWidth = popupElement.offsetWidth;

      // Fallback if dimensions are 0 (e.g., if not fully rendered yet, though less likely for simple popups)
      if (popupHeight === 0) popupHeight = 50; // Approximate fallback height
      if (popupWidth === 0) popupWidth = 200;  // Approximate fallback width

      const offsetParentEl = popupElement.offsetParent as HTMLElement | null;

      if (!offsetParentEl) {
        console.warn(
          "SelectionPopup: offsetParent not found. Positioning will be relative to viewport, which might be incorrect if not a direct child of body."
        );
        // Fallback to original viewport-relative logic (less accurate if MailReader is the intended positioning context)
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        let top = scrollY + selectionViewportRect.top - popupHeight - 10; // 10px offset from selection
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
          zIndex: 1000, // Ensure it's above other content
        });
        return;
      }

      // If offsetParentEl is found (this should be your mailReaderRef div)
      const offsetParentRect = offsetParentEl.getBoundingClientRect(); // Viewport-relative rect of the offset parent

      // Calculate top:
      // (selectionViewportRect.top - offsetParentRect.top) = selection's top relative to offsetParent's visible top edge
      // + offsetParentEl.scrollTop = adjust for how much the offsetParent is scrolled
      // - popupHeight - 10 = position above selection with a 10px margin
      let top = (selectionViewportRect.top - offsetParentRect.top) +
        offsetParentEl.scrollTop -
        popupHeight -
        10;

      // Calculate left:
      // (selectionViewportRect.left - offsetParentRect.left) = selection's left relative to offsetParent's visible left edge
      // + offsetParentEl.scrollLeft = adjust for horizontal scroll (if any)
      // + (selectionViewportRect.width / 2) = center of selection
      // - (popupWidth / 2) = offset by half of popup's width to center popup
      let left = (selectionViewportRect.left - offsetParentRect.left) +
        offsetParentEl.scrollLeft +
        (selectionViewportRect.width / 2) -
        (popupWidth / 2);

      const marginFromOffsetParentEdge = 8; // Margin from the edges of the offsetParent

      // Boundary checks relative to the offsetParentEl
      // Ensure popup top is not less than marginFromOffsetParentEdge from the top of offsetParentEl's content area
      top = Math.max(marginFromOffsetParentEdge, top);

      // Ensure popup left is not less than marginFromOffsetParentEdge from the left of offsetParentEl's content area
      left = Math.max(marginFromOffsetParentEdge, left);

      // Ensure popup does not go off the right edge of the offsetParentEl's client (visible) width
      if (left + popupWidth > offsetParentEl.clientWidth - marginFromOffsetParentEdge) {
        left = offsetParentEl.clientWidth - popupWidth - marginFromOffsetParentEdge;
      }

      // (Optional) Ensure popup does not go off the bottom edge if it were to be positioned below
      // For popups strictly above, this might not be necessary unless popupHeight is very large or selection is at the very bottom.
      // if (top + popupHeight > offsetParentEl.scrollTop + offsetParentEl.clientHeight - marginFromOffsetParentEdge) {
      //   top = offsetParentEl.scrollTop + offsetParentEl.clientHeight - popupHeight - marginFromOffsetParentEdge;
      // }

      setPopupStyle({
        top: `${top}px`,
        left: `${left}px`,
        position: 'absolute', // This should already be set by className/style
        zIndex: 1000,
      });
    }
  }, [activePopup]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        const targetElement = event.target as HTMLElement;
        if (!targetElement.closest('.bookmark-highlight')) { // Don't hide if clicking another highlight
          hidePopup();
        }
      }
    };

    if (activePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
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

  // Using Tailwind classes from prompt.
  // bg-content -> bg-slate-800 (dark example)
  // border-secondary -> border-slate-600 (dark example)
  // text-muted-foreground -> text-slate-400 (dark example)
  const iconButtonClass = "p-2 rounded-full hover:bg-hovered transition-colors text-muted-foreground";

  return (
    <div
      ref={popupRef}
      style={popupStyle}
      className="bg-sidebar text-sm border border-hovered rounded-full shadow-xl flex items-center space-x-1 p-1"
      onClick={(e) => e.stopPropagation()} // Prevent clicks inside popup from closing it via outside click handler
    >
      <button onClick={handleCancel} title="Remove bookmark" className={`${iconButtonClass}`}>
        <XCircleIcon className="h-6 w-6 text-red-400 " />
      </button>
      <button onClick={() => alert('Add comment (not implemented)')} title="Add comment" className={iconButtonClass}>
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
            className="absolute right-0 top-full mt-2 bg-content text-popover-foreground px-2 py-1 rounded text-xs shadow-md z-10"
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