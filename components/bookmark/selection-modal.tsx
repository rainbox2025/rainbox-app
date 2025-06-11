"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useBookmarks } from '@/context/bookmarkContext';
import {
  XCircleIcon,
  ChatBubbleBottomCenterIcon,
  TagIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';

const SelectionPopup: React.FC = () => {
  const {
    activePopup, hidePopup, removeBookmark, getBookmarkById,
    confirmBookmark, showCommentModal, showTagModal
  } = useBookmarks();

  const popupRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activePopup && popupRef.current) {
      const { rect: triggerRect } = activePopup;
      const popupEl = popupRef.current;
      const offsetParent = popupEl.offsetParent as HTMLElement | null;

      if (offsetParent) {
        const parentRect = offsetParent.getBoundingClientRect();
        let popupHeight = popupEl.offsetHeight || 50;
        let popupWidth = popupEl.offsetWidth || 200;
        const margin = 8;

        let top = (triggerRect.top - parentRect.top) + offsetParent.scrollTop - popupHeight - 10;
        let left = (triggerRect.left - parentRect.left) + offsetParent.scrollLeft + (triggerRect.width / 2) - (popupWidth / 2);

        if (top < offsetParent.scrollTop + margin) {
          top = (triggerRect.bottom - parentRect.top) + offsetParent.scrollTop + 10;
        }

        left = Math.max(offsetParent.scrollLeft + margin, left);
        left = Math.min(left, offsetParent.scrollLeft + parentRect.width - popupWidth - margin);

        setPopupStyle({ top: `${top}px`, left: `${left}px`, position: 'absolute', zIndex: 1000 });
      }
    }
  }, [activePopup]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!activePopup || (popupRef.current && popupRef.current.contains(event.target as Node))) return;
      const targetElement = event.target as HTMLElement;
      if (!targetElement.closest('.bookmark-highlight, .comment-modal-root-class, .tag-modal-root-class')) {
        hidePopup();
      }
    };
    if (activePopup) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePopup, hidePopup]);

  if (!activePopup) return null;

  const bookmark = getBookmarkById(activePopup.bookmarkId);
  if (!bookmark) return null;

  const isConfirmed = bookmark.isConfirmed !== false;
  const iconButtonClass = "p-2 rounded-full hover:bg-hovered transition-colors text-muted-foreground";

  return (
    <div ref={popupRef} style={popupStyle} className="bg-sidebar text-sm border border-hovered rounded-full shadow-xl flex items-center space-x-1 p-0 selection-popup-class-name" onClick={(e) => e.stopPropagation()}>
      <button onClick={isConfirmed ? () => removeBookmark(bookmark.id) : () => confirmBookmark(bookmark.id)} title={isConfirmed ? "Remove highlight" : "Confirm highlight"} className={iconButtonClass}>
        {isConfirmed ? <XCircleIcon className="h-6 w-6 text-red-400" /> : <SparklesIcon className="h-6 w-6 text-yellow-400" />}
      </button>
      <button onClick={() => showCommentModal(bookmark.id, activePopup.rect)} title="Add/Edit comment" className={iconButtonClass}>
        <ChatBubbleBottomCenterIcon className="h-5 w-5" />
      </button>
      <button onClick={() => showTagModal(bookmark.id, activePopup.rect)} title="Add/Edit tags" className={iconButtonClass}>
        <TagIcon className="h-5 w-5" />
      </button>
      <button onClick={async () => {
        if (!bookmark.text) return;
        await navigator.clipboard.writeText(bookmark.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }} title={copied ? "Copied!" : "Copy text"} className={`${iconButtonClass} ${copied ? 'text-green-400' : ''}`}>
        <DocumentDuplicateIcon className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {copied && (
          <motion.div className="absolute right-0 top-full mt-2 bg-sidebar text-popover-foreground px-2 py-1 rounded text-xs shadow-md z-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            Copied
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectionPopup;