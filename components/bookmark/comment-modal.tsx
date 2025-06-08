"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useBookmarks } from '@/context/bookmarkContext'; // Adjust path as needed
import { Button } from '../ui/button';

const CommentModal: React.FC = () => {
  const {
    activeCommentModal,
    hideCommentModal,
    getBookmarkById,
    addOrUpdateComment,
  } = useBookmarks();

  const [note, setNote] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});

  const bookmark = activeCommentModal ? getBookmarkById(activeCommentModal.bookmarkId) : null;

  useEffect(() => {
    if (bookmark) {
      setNote(bookmark.comment || '');
      setTimeout(() => textareaRef.current?.focus(), 0);
    } else {
      setNote('');
    }
  }, [bookmark]);

  useEffect(() => {
    if (activeCommentModal && modalRef.current) {
      const { rect: selectionViewportRect } = activeCommentModal;
      const popupElement = modalRef.current;
      const offsetParentEl = popupElement.offsetParent as HTMLElement | null;

      const modalWidth = Math.min(300, window.innerWidth - 32);
      const modalHeight = popupElement.offsetHeight || 150;

      let top, left;

      if (offsetParentEl) {
        const offsetParentRect = offsetParentEl.getBoundingClientRect();
        top = (selectionViewportRect.bottom - offsetParentRect.top) + offsetParentEl.scrollTop + 10;
        left = (selectionViewportRect.left - offsetParentRect.top) + offsetParentEl.scrollLeft + (selectionViewportRect.width / 2) - (modalWidth / 2);

        const margin = 8;
        left = Math.max(offsetParentEl.scrollLeft + margin, left);
        if (left + modalWidth > offsetParentEl.scrollLeft + offsetParentEl.clientWidth - margin) {
          left = offsetParentEl.scrollLeft + offsetParentEl.clientWidth - modalWidth - margin;
        }
        if (top + modalHeight > offsetParentEl.scrollTop + offsetParentEl.clientHeight - margin) {
          top = (selectionViewportRect.top - offsetParentRect.top) + offsetParentEl.scrollTop - modalHeight - 10;
        }
        top = Math.max(offsetParentEl.scrollTop + margin, top);


      } else {
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        top = scrollY + selectionViewportRect.bottom + 10;
        left = scrollX + selectionViewportRect.left + (selectionViewportRect.width / 2) - (modalWidth / 2);

        const margin = 8;
        left = Math.max(scrollX + margin, left);
        if (left + modalWidth > scrollX + window.innerWidth - margin) {
          left = scrollX + window.innerWidth - modalWidth - margin;
        }
        if (top + modalHeight > scrollY + window.innerHeight - margin) {
          top = scrollY + selectionViewportRect.top - modalHeight - 10;
        }
        top = Math.max(scrollY + margin, top);
      }

      setModalStyle({
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${modalWidth}px`,
        zIndex: 1001,
      });
    }
  }, [activeCommentModal]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        hideCommentModal();
      }
    };
    if (activeCommentModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeCommentModal, hideCommentModal]);

  if (!activeCommentModal || !bookmark) {
    return null;
  }

  const handleSave = () => {
    addOrUpdateComment(bookmark.id, note.trim());
    hideCommentModal();
  };

  const handleCancel = () => {
    hideCommentModal();
  };

  return (
    <div
      ref={modalRef}
      style={modalStyle}
      className="bg-sidebar shadow-xl rounded-lg p-2 border border-hovered comment-modal-root-class" // Added class
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note..."
        className="w-full h-12 p-2 bg-transparent rounded-md resize-none outline-none text-sm "
      />
      <div className="flex justify-end mt-3 space-x-2">
        <Button
          onClick={handleCancel}
          className="px-2 py-1 h-auto min-h-0 leading-none bg-secondary text-muted-foreground hover:bg-hovered text-xs font-medium rounded"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="px-2 py-1 h-auto min-h-0 leading-none bg-primary text-xs font-medium rounded"
        >
          Save
        </Button>

      </div>

    </div>
  );
};

export default CommentModal;