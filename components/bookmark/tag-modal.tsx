"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBookmarks } from '@/context/bookmarkContext';
import { XMarkIcon } from '@heroicons/react/24/solid';

const TagModal: React.FC = () => {
  const {
    activeTagModal,
    hideTagModal,
    getBookmarkById,
    updateBookmarkTags,
    allTags,
  } = useBookmarks();

  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [modalStyle, setModalStyle] = useState<React.CSSProperties>({});

  const bookmark = activeTagModal ? getBookmarkById(activeTagModal.bookmarkId) : null;

  useEffect(() => {
    if (bookmark) {
      setSelectedTags(bookmark.tags || []);
      setInputValue('');
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setSelectedTags([]);
      setInputValue('');
    }
  }, [bookmark]);

  useEffect(() => {
    if (activeTagModal && modalRef.current) {
      const { rect: selectionViewportRect } = activeTagModal;
      const popupElement = modalRef.current;
      const offsetParentEl = popupElement.offsetParent as HTMLElement | null;

      const modalWidth = Math.min(300, window.innerWidth - 32);
      let modalHeight = popupElement.offsetHeight;
      // A more dynamic initial estimate, can be refined
      if (!modalHeight || modalHeight < 100) modalHeight = 150;

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
    // Re-calculate on content change which might affect height.
    // Also activeTagModal to reposition when it appears.
  }, [activeTagModal, inputValue, selectedTags, allTags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Before hiding, save current tags if any changes were made implicitly
        if (bookmark && (selectedTags.join(',') !== (bookmark.tags || []).join(','))) {
          updateBookmarkTags(bookmark.id, selectedTags);
        }
        hideTagModal();
      }
    };
    if (activeTagModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTagModal, hideTagModal, bookmark, selectedTags, updateBookmarkTags]);

  const handleAddTag = useCallback((tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && bookmark && !selectedTags.includes(normalizedTag)) {
      const newTags = [...selectedTags, normalizedTag];
      setSelectedTags(newTags);
      updateBookmarkTags(bookmark.id, newTags); // Update context immediately
    }
    setInputValue('');
    inputRef.current?.focus();
  }, [bookmark, selectedTags, updateBookmarkTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    if (bookmark) {
      const newTags = selectedTags.filter(t => t !== tagToRemove);
      setSelectedTags(newTags);
      updateBookmarkTags(bookmark.id, newTags); // Update context immediately
    }
    inputRef.current?.focus();
  }, [bookmark, selectedTags, updateBookmarkTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
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

  if (!activeTagModal || !bookmark) {
    return null;
  }

  const normalizedInputValue = inputValue.toLowerCase().trim();

  const getSuggestions = () => {
    const availableGlobalTags = allTags.filter(
      (tag) => !selectedTags.includes(tag.toLowerCase())
    );

    if (normalizedInputValue) {
      return availableGlobalTags
        .filter((tag) => tag.toLowerCase().includes(normalizedInputValue))
        .slice(0, 5); // Limit suggestions
    }
    return availableGlobalTags.slice(0, 5);
  };
  const filteredSuggestions = getSuggestions();

  const canCreateTag = normalizedInputValue &&
    !allTags.some(t => t.toLowerCase() === normalizedInputValue) &&
    !selectedTags.includes(normalizedInputValue);

  return (
    <div
      ref={modalRef}
      style={modalStyle}
      className="bg-sidebar shadow-xl rounded-lg p-3 border border-hovered flex flex-col text-sm tag-modal-root-class"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Input Area: Selected Tags + Input Field */}
      <div
        className="flex flex-wrap items-center  gap-x-1.5 gap-y-1 p-2 rounded-md mb-2 cursor-text min-h-[38px] focus-within:border-primary"
        onClick={() => inputRef.current?.focus()} // Focus input on click
      >
        {selectedTags.map(tag => (
          <span
            key={tag}
            className="bg-primary/20 text-xs  px-2 py-1 rounded-md flex items-center gap-1 whitespace-nowrap"
          >
            {tag}
            <XMarkIcon
              className="h-3 w-3 cursor-pointer text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag);
              }}
            />
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length > 0 ? "typing here..." : "Find or create highlight tag..."}
          className="flex-grow bg-transparent outline-none text-xs p-0.5 min-w-[120px] placeholder-muted-foreground"
        />
      </div>

      {/* Suggestions Area */}
      <div className="max-h-32 border-t border-hovered overflow-y-auto text-xs mt-1 custom-scrollbar">
        {/* Existing Tag Suggestions */}
        {filteredSuggestions.map(tag => (
          <div
            key={tag}
            className="p-1.5 hover:bg-hovered rounded-md cursor-pointer"
            onClick={() => handleAddTag(tag)}
          >
            {tag}
          </div>
        ))}

        {/* Create Tag Suggestion */}
        {canCreateTag && (
          <div
            className="flex items-center justify-start gap-2 p-1.5 hover:bg-hovered rounded-md cursor-pointer"
            onClick={() => handleAddTag(inputValue.trim())}
          >
            <span className="text-muted-foreground">Create tag</span>
            <span className="bg-primary/20  text-xs px-2 py-0.5 rounded-sm">
              {inputValue.trim()}
            </span>
          </div>
        )}

        {/* Informational messages */}
        {inputValue && filteredSuggestions.length === 0 && !canCreateTag && (
          <div className="p-1.5 text-muted-foreground italic text-xs">
            {selectedTags.includes(normalizedInputValue)
              ? "Tag already added."
              : (allTags.some(t => t.toLowerCase() === normalizedInputValue) ? "No other suggestions for this input." : "No matching tags found.")}
          </div>
        )}
        {!inputValue && filteredSuggestions.length === 0 && !canCreateTag && (
          <div className="p-1.5 text-muted-foreground italic text-xs">
            {allTags.length === 0 ? "No tags yet. Type to create one." :
              (allTags.every(t => selectedTags.includes(t.toLowerCase())) && allTags.length > 0 ? "All available tags selected." : "Type to find or create tags.")}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagModal;