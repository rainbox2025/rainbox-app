"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useBookmarks } from '@/context/bookmarkContext';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

const CommentModal: React.FC = () => {
  const {
    activeCommentModal,
    hideCommentModal,
    getBookmarkById,
    addOrUpdateComment,
    activeAction
  } = useBookmarks();

  const [note, setNote] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});

  const bookmark = activeCommentModal ? getBookmarkById(activeCommentModal.bookmarkId) : null;
  const isLoading = activeAction?.id === bookmark?.id && activeAction?.type === 'comment_save';

  useEffect(() => {
    if (bookmark) {
      setNote(bookmark.comment || '');
      setTimeout(() => textareaRef.current?.focus(), 50);
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
      const margin = 8;
      let top, left;

      if (offsetParentEl) {
        const offsetParentRect = offsetParentEl.getBoundingClientRect();
        top = (selectionViewportRect.bottom - offsetParentRect.top) + offsetParentEl.scrollTop + 10;
        left = (selectionViewportRect.left - offsetParentRect.top) + offsetParentEl.scrollLeft + (selectionViewportRect.width / 2) - (modalWidth / 2);

        if (left < offsetParentEl.scrollLeft + margin) {
          left = offsetParentEl.scrollLeft + margin;
        }
        if (left + modalWidth > offsetParentEl.scrollLeft + offsetParentEl.clientWidth - margin) {
          left = offsetParentEl.scrollLeft + offsetParentEl.clientWidth - modalWidth - margin;
        }
        if (top + modalHeight > offsetParentEl.scrollTop + offsetParentEl.clientHeight - margin) {
          top = (selectionViewportRect.top - offsetParentRect.top) + offsetParentEl.scrollTop - modalHeight - 10;
        }
        if (top < offsetParentEl.scrollTop + margin) {
          top = offsetParentEl.scrollTop + margin;
        }
      } else {
        top = window.scrollY + selectionViewportRect.bottom + 10;
        left = window.scrollX + selectionViewportRect.left + (selectionViewportRect.width / 2) - (modalWidth / 2);
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
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && !isLoading) {
        hideCommentModal();
      }
    };
    if (activeCommentModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeCommentModal, hideCommentModal, isLoading]);


  const handleSave = async () => {
    if (!bookmark || isLoading) return;
    await addOrUpdateComment(bookmark.id, note.trim());
    hideCommentModal();
  };

  const handleCancel = () => {
    if (!isLoading) {
      hideCommentModal();
    }
  };

  if (!activeCommentModal || !bookmark) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      style={modalStyle}
      className="bg-sidebar shadow-xl rounded-lg p-2 border border-hovered comment-modal-root-class"
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note..."
        className="w-full h-16 p-2 bg-transparent rounded-md resize-none outline-none text-sm custom-scrollbar"
        disabled={isLoading}
      />
      <div className="flex justify-end mt-2 space-x-2">
        <Button
          onClick={handleCancel}
          variant="secondary"
          size="sm"
          className="text-xs"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          size="sm"
          className="text-xs w-16"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default CommentModal;