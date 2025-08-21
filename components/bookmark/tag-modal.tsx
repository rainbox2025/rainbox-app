"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBookmarks } from '@/context/bookmarkContext';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Loader2 } from 'lucide-react';

const TagModal: React.FC = () => {
  const {
    activeTagModal,
    hideTagModal,
    getBookmarkById,
    updateBookmarkTags,
    allTags,
    activeAction
  } = useBookmarks();

  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});

  const bookmark = activeTagModal ? getBookmarkById(activeTagModal.bookmarkId) : null;
  const isLoading = activeAction?.id === bookmark?.id && activeAction?.type === 'tag_update';

  useEffect(() => {
    if (bookmark) {
      setSelectedTags(bookmark.tags || []);
      setInputValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [bookmark]);

  useEffect(() => {
    if (activeTagModal && modalRef.current) {
      const { rect: selectionViewportRect } = activeTagModal;
      const popupElement = modalRef.current;
      const offsetParentEl = popupElement.offsetParent as HTMLElement | null;

      const modalWidth = Math.min(300, window.innerWidth - 32);
      let modalHeight = popupElement.offsetHeight || 150;
      const margin = 8;
      let top, left;

      if (offsetParentEl) {
        const offsetParentRect = offsetParentEl.getBoundingClientRect();
        top = (selectionViewportRect.bottom - offsetParentRect.top) + offsetParentEl.scrollTop + 10;
        left = (selectionViewportRect.left - offsetParentRect.top) + offsetParentEl.scrollLeft + (selectionViewportRect.width / 2) - (modalWidth / 2);

        if (left < offsetParentEl.scrollLeft + margin) left = offsetParentEl.scrollLeft + margin;
        if (left + modalWidth > offsetParentEl.scrollLeft + offsetParentEl.clientWidth - margin) {
          left = offsetParentEl.scrollLeft + offsetParentEl.clientWidth - modalWidth - margin;
        }
        if (top + modalHeight > offsetParentEl.scrollTop + offsetParentEl.clientHeight - margin) {
          top = (selectionViewportRect.top - offsetParentRect.top) + offsetParentEl.scrollTop - modalHeight - 10;
        }
        if (top < offsetParentEl.scrollTop + margin) top = offsetParentEl.scrollTop + margin;
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
  }, [activeTagModal, inputValue, selectedTags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && !isLoading) {
        hideTagModal();
      }
    };
    if (activeTagModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTagModal, hideTagModal, isLoading]);

  const handleUpdateTags = async (newTags: string[]) => {
    if (bookmark && !isLoading) {
      setSelectedTags(newTags);
      await updateBookmarkTags(bookmark.id, newTags);
    }
  };

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !selectedTags.includes(normalizedTag)) {
      handleUpdateTags([...selectedTags, normalizedTag]);
    }
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleUpdateTags(selectedTags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue.trim());
    } else if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
      e.preventDefault();
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  if (!activeTagModal || !bookmark) return null;

  const normalizedInputValue = inputValue.toLowerCase().trim();
  const availableGlobalTags = allTags.filter(tag => !selectedTags.includes(tag.toLowerCase()));
  const filteredSuggestions = normalizedInputValue
    ? availableGlobalTags.filter(tag => tag.toLowerCase().includes(normalizedInputValue)).slice(0, 5)
    : availableGlobalTags.slice(0, 5);
  const canCreateTag = normalizedInputValue && !allTags.some(t => t.toLowerCase() === normalizedInputValue) && !selectedTags.includes(normalizedInputValue);

  return (
    <div
      ref={modalRef}
      style={modalStyle}
      className="bg-sidebar shadow-xl rounded-lg p-1 border border-hovered flex flex-col text-sm tag-modal-root-class relative"
      onClick={(e) => e.stopPropagation()}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-sidebar/60 flex items-center justify-center z-20 rounded-lg">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <div
        className="flex flex-wrap items-center gap-1.5 p-2 rounded-md cursor-text min-h-[38px] focus-within:ring-1 focus-within:ring-primary"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map(tag => (
          <span key={tag} className="bg-primary/20 text-xs px-2 py-1 rounded-md flex items-center gap-1 whitespace-nowrap">
            {tag}
            <XMarkIcon
              className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
            />
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length > 0 ? "" : "Find or create tag..."}
          className="flex-grow bg-transparent outline-none text-xs p-0.5 min-w-[120px]"
          disabled={isLoading}
        />
      </div>

      <div className="max-h-32 border-t border-hovered overflow-y-auto text-xs mt-1 custom-scrollbar">
        {filteredSuggestions.map(tag => (
          <div
            key={tag}
            className="p-1.5 hover:bg-hovered rounded-md cursor-pointer"
            onClick={() => handleAddTag(tag)}
          >
            {tag}
          </div>
        ))}
        {canCreateTag && (
          <div
            className="flex items-center justify-start gap-2 p-1.5 hover:bg-hovered rounded-md cursor-pointer"
            onClick={() => handleAddTag(inputValue.trim())}
          >
            <span className="text-muted-foreground">Create tag</span>
            <span className="bg-primary/20 text-xs px-2 py-0.5 rounded-sm">
              {inputValue.trim()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagModal;