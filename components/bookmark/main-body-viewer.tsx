"use client";

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useBookmarks } from '@/context/bookmarkContext';

interface MailBodyViewerProps {
  htmlContent: string;
  mailId?: string;
}

const MailBodyViewer: React.FC<MailBodyViewerProps> = ({ htmlContent, mailId }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    bookmarks,
    addBookmark,
    showPopup,
    deserializeRange,
    removeBookmark // For cleaning up bookmarks whose ranges become invalid
  } = useBookmarks();

  // Filter bookmarks for the current mailId
  const currentMailBookmarks = useMemo(() => {
    return mailId ? bookmarks.filter(b => b.mailId === mailId) : bookmarks;
  }, [bookmarks, mailId]);


  // Effect to render highlights based on bookmarks
  useEffect(() => {
    if (!contentRef.current || !htmlContent) return;

    // 1. Set the raw HTML content (this removes all old highlight spans)
    contentRef.current.innerHTML = htmlContent;

    // 2. Apply highlights for all relevant bookmarks
    // Sort bookmarks by their start position to handle nested/adjacent cases somewhat predictably,
    // though with full DOM reset and extractContents, overlaps are tricky.
    // A more advanced system would merge overlapping/adjacent highlights.
    const sortedBookmarks = [...currentMailBookmarks].sort((a, b) => {
      // Basic sort: try to deserialize and compare start points.
      // This is a simplified sort; robust range sorting is complex.
      const rangeA = deserializeRange(a.serializedRange, contentRef.current!);
      const rangeB = deserializeRange(b.serializedRange, contentRef.current!);
      if (rangeA && rangeB) {
        return rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB);
      }
      return 0;
    });

    const bookmarksToRemove: string[] = [];

    sortedBookmarks.forEach(bookmark => {
      if (!contentRef.current) return;
      const range = deserializeRange(bookmark.serializedRange, contentRef.current);

      if (range) {
        try {
          // Validate that the range is still somewhat valid (e.g., not collapsed, common ancestor in doc)
          if (range.collapsed || !contentRef.current.contains(range.commonAncestorContainer)) {
            console.warn("Bookmark range is collapsed or common ancestor invalid, scheduling for removal:", bookmark.id);
            bookmarksToRemove.push(bookmark.id);
            return;
          }

          const span = document.createElement('span');
          span.className = 'bookmark-highlight';
          span.dataset.bookmarkId = bookmark.id;

          // Store mousedown coords to differentiate click from drag-select end on the highlight itself
          // This helps ensure clicking a highlight shows the popup, not treated as a new selection.
          let mouseDownX = 0, mouseDownY = 0;
          span.onmousedown = (e) => {
            e.stopPropagation(); // Prevent starting a new selection drag from within a highlight
            mouseDownX = e.clientX;
            mouseDownY = e.clientY;
          };
          span.onclick = (e) => {
            e.stopPropagation(); // Critical to stop event from bubbling to contentRef mouseup
            const MOUSE_CLICK_THRESHOLD = 5; // px
            if (Math.abs(e.clientX - mouseDownX) < MOUSE_CLICK_THRESHOLD &&
              Math.abs(e.clientY - mouseDownY) < MOUSE_CLICK_THRESHOLD) {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              showPopup(bookmark.id, rect);
            }
          };

          // More robust highlighting:
          const contents = range.extractContents(); // Removes content from doc, puts in DocumentFragment
          span.appendChild(contents);              // Add the extracted content to our new span
          range.insertNode(span);                  // Insert the span (with its content) back

        } catch (error) {
          console.error(`Error applying highlight for bookmark ${bookmark.id}:`, error);
          // If a bookmark consistently fails to apply, it might be due to a corrupted range or DOM state.
          // Consider adding it to bookmarksToRemove if errors persist for a specific bookmark.
          // For now, we'll let it try again on next render. If range is truly bad, deserializeRange might return null.
          if (error instanceof DOMException && error.name === 'NotFoundError') {
            console.warn(`Node not found for bookmark ${bookmark.id}, scheduling for removal.`);
            bookmarksToRemove.push(bookmark.id);
          }
        }
      } else {
        console.warn(`Could not deserialize range for bookmark ${bookmark.id}. Content might have changed significantly. Scheduling for removal.`);
        bookmarksToRemove.push(bookmark.id);
      }
    });

    if (bookmarksToRemove.length > 0) {
      console.log("Cleaning up invalid bookmarks:", bookmarksToRemove);
      bookmarksToRemove.forEach(id => removeBookmark(id));
    }

    // After all DOM manipulations, clear any residual browser selection
    window.getSelection()?.removeAllRanges();

  }, [htmlContent, currentMailBookmarks, deserializeRange, showPopup, removeBookmark]);


  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!contentRef.current) return;

    // Prevent creating new selection if mouseup is on an existing highlight's popup interaction elements
    if ((event.target as HTMLElement).closest('.bookmark-highlight span')) { // If popup icons are spans
      // Or check if event.target is inside the popup itself if it's rendered differently
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0).cloneRange(); // Clone to avoid issues if selection is cleared
      const text = selection.toString().trim();

      if (text.length === 0) {
        selection.removeAllRanges();
        return;
      }

      if (!contentRef.current.contains(range.commonAncestorContainer) ||
        (range.commonAncestorContainer === contentRef.current &&
          range.startOffset === range.endOffset &&
          range.startOffset === 0 &&
          contentRef.current.childNodes.length === 0) // Empty selection in empty root
      ) {
        selection.removeAllRanges();
        return;
      }

      // Prevent creating new bookmark if selection is entirely within an existing one.
      // The existing highlight's click handler should manage showing the popup.
      let current = range.commonAncestorContainer;
      let insideExistingHighlight = false;
      while (current && current !== contentRef.current) {
        if (current.nodeType === Node.ELEMENT_NODE && (current as HTMLElement).classList?.contains('bookmark-highlight')) {
          insideExistingHighlight = true;
          break;
        }
        current = current.parentNode as Node;
      }
      if (insideExistingHighlight) {
        // If user *is* trying to select a sub-part of an existing highlight, this prevents it.
        // To allow sub-highlighting or modifying existing, more complex logic is needed.
        // For now, clicking an existing highlight will trigger its own popup.
        selection.removeAllRanges(); // Clear selection to avoid native blue highlight lingering
        return;
      }

      const rect = range.getBoundingClientRect();

      const newBookmark = addBookmark(text, range, contentRef.current, mailId);
      if (newBookmark) {
        showPopup(newBookmark.id, rect);
      }

      selection.removeAllRanges(); // Clear browser's native blue selection after processing
    }
  }, [addBookmark, showPopup, mailId]); // Removed getSerializedRange as addBookmark internally uses the one from context closure

  // Mouseup listener on the content container
  useEffect(() => {
    const currentContentElement = contentRef.current;
    if (currentContentElement) {
      // Cast to EventListener for compatibility
      const listener = handleMouseUp as unknown as EventListener;
      currentContentElement.addEventListener('mouseup', listener);
      return () => {
        currentContentElement.removeEventListener('mouseup', listener);
      };
    }
  }, [handleMouseUp]);

  return (
    <div
      ref={contentRef}
      className="prose text-sm prose-sm dark:prose-invert max-w-none"
    // `dangerouslySetInnerHTML` is managed by the useEffect now to apply highlights
    // Initial render will be empty or set by useEffect. For initial content before JS:
    // dangerouslySetInnerHTML={{ __html: htmlContent }} // This would be overwritten by useEffect
    />
  );
};

export default MailBodyViewer;