"use client";

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useBookmarks } from '@/context/bookmarkContext';

interface MailBodyViewerProps {
  htmlContent: string;
  mailId?: string;
}

// Helper function to create SVG indicators
const createIndicatorSvg = (type: 'comment' | 'tag', bookmarkId: string) => {
  const paths = {
    comment: "M5 2C3.34315 2 2 3.34315 2 5V9C2 10.6569 3.34315 12 5 12H6L8 15L10 12H11C12.6569 12 14 10.6569 14 9V5C14 3.34315 12.6569 2 11 2H5Z",
    tag: "M13.5858 7.58579L8.58579 2.58579C8.21071 2.21071 7.70201 2 7.17157 2H4C2.89543 2 2 2.89543 2 4V7.17157C2 7.70201 2.21071 8.21071 2.58579 8.58579L7.58579 13.5858C8.36684 14.3668 9.63316 14.3668 10.4142 13.5858L13.5858 10.4142C14.3668 9.63317 14.3668 8.36684 13.5858 7.58579ZM6 7C6.55228 7 7 6.55228 7 6C7 5.44771 6.55228 5 6 5C5.44772 5 5 5.44771 5 6C5 6.55228 5.44772 7 6 7Z"
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" height="13" width="13" class="${type}-indicator-icon" data-bookmark-id="${bookmarkId}" style="margin: 0 2px; fill: currentColor; display: inline-block; cursor: pointer;"><path d="${paths[type]}"></path></svg>`;
};

// ** NEW, MORE ROBUST HIGHLIGHTING ENGINE **
// This function is updated to specifically handle the single-node case,
// which was previously failing, while preserving the working multi-node logic.
const highlightRange = (range: Range, bookmarkId: string, isConfirmed: boolean): void => {
  if (range.collapsed) {
    return;
  }

  const highlightClassName = `bookmark-highlight ${isConfirmed ? 'bookmark-highlight-confirmed' : 'bookmark-highlight-unconfirmed'}`;

  // --- FIX START ---
  // Case 1: The selection is completely within a single text node.
  // This is the common case for single-line selections and was the source of the bug.
  // We handle it directly with `surroundContents` for maximum reliability, avoiding the TreeWalker.
  if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
    try {
      const span = document.createElement('span');
      span.className = highlightClassName;
      span.dataset.bookmarkId = bookmarkId;
      range.surroundContents(span);
    } catch (e) {
      console.error("Highlighting failed for single text node range:", e);
    }
    return; // Exit after handling the simple case.
  }
  // --- FIX END ---

  // Case 2: The selection spans multiple nodes (this was already working correctly).
  // We use a TreeWalker to find all intersecting text nodes.
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // The TreeWalker will only visit text nodes. We check if the range intersects this node.
        return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  // Collect nodes first to avoid issues with modifying the DOM while iterating.
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  // Now, iterate over the collected nodes and wrap the relevant parts.
  nodes.forEach(node => {
    const localRange = document.createRange();

    // Determine the part of the node to wrap.
    const start = (node === range.startContainer) ? range.startOffset : 0;
    const end = (node === range.endContainer) ? range.endOffset : node.length;

    // Skip empty or invalid segments.
    if (start === end) {
      return;
    }

    localRange.setStart(node, start);
    localRange.setEnd(node, end);

    try {
      // A new span must be created for each distinct segment of the highlight.
      const span = document.createElement('span');
      span.className = highlightClassName;
      span.dataset.bookmarkId = bookmarkId;
      localRange.surroundContents(span);
    } catch (e) {
      console.error("Highlighting failed for a multi-node segment:", e);
    }
  });
};

const MailBodyViewer: React.FC<MailBodyViewerProps> = ({ htmlContent, mailId }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    bookmarks, addBookmark, showPopup, deserializeRange,
    removeBookmark, showCommentModal, showTagModal,
  } = useBookmarks();

  const currentMailBookmarks = useMemo(() =>
    mailId ? bookmarks.filter(b => b.mailId === mailId) : bookmarks,
    [bookmarks, mailId]
  );

  useEffect(() => {
    if (!contentRef.current || !htmlContent) return;

    // Start with a clean slate to ensure idempotency.
    contentRef.current.innerHTML = htmlContent;
    const bookmarksToRemove: string[] = [];

    // Sort bookmarks to apply them from the end of the document to the start.
    // This prevents DOM modifications from invalidating the ranges of subsequent bookmarks.
    const sortedBookmarks = [...currentMailBookmarks].sort((a, b) => {
      const rangeA = deserializeRange(a.serializedRange, contentRef.current!);
      const rangeB = deserializeRange(b.serializedRange, contentRef.current!);
      if (!rangeA || !rangeB) return 0;
      // Sort in reverse document order.
      return rangeB.compareBoundaryPoints(Range.START_TO_START, rangeA);
    });

    sortedBookmarks.forEach(bookmark => {
      if (!contentRef.current) return;
      const range = deserializeRange(bookmark.serializedRange, contentRef.current);

      if (range && contentRef.current.contains(range.commonAncestorContainer)) {
        const isConfirmed = bookmark.isConfirmed !== false;
        // Call the new, robust highlighting function.
        highlightRange(range, bookmark.id, isConfirmed);
      } else {
        // If the range can't be deserialized, mark the bookmark for removal.
        bookmarksToRemove.push(bookmark.id);
      }
    });

    // Attach event listeners and indicators after all DOM mutations are done.
    // This is more efficient than doing it inside the highlighting function.
    const processedBookmarkIds = new Set<string>();
    sortedBookmarks.forEach(bookmark => {
      if (processedBookmarkIds.has(bookmark.id)) return;
      processedBookmarkIds.add(bookmark.id);

      const highlightSpans = Array.from(
        contentRef.current?.querySelectorAll(`.bookmark-highlight[data-bookmark-id="${bookmark.id}"]`) || []
      ) as HTMLElement[];

      if (highlightSpans.length === 0) return;

      highlightSpans.forEach(span => {
        let isDragging = false;
        span.onmousedown = () => { isDragging = false; };
        span.onmousemove = () => { isDragging = true; };
        span.onmouseup = (e) => {
          if (isDragging) return; // This was a drag-select, not a click.
          // Prevent icon clicks from triggering the popup for the whole highlight.
          if ((e.target as HTMLElement).closest('.comment-indicator-icon, .tag-indicator-icon')) {
            e.stopPropagation(); return;
          }
          e.stopPropagation();
          const bookmarkId = (e.currentTarget as HTMLElement).dataset.bookmarkId;
          if (bookmarkId) {
            showPopup(bookmarkId, (e.currentTarget as HTMLElement).getBoundingClientRect());
          }
        };
      });

      // Add comment/tag indicators to the last span of a highlight.
      const lastSpan = highlightSpans[highlightSpans.length - 1];
      if (bookmark.isConfirmed && bookmark.comment) {
        const indicator = document.createElement('span');
        indicator.innerHTML = createIndicatorSvg('comment', bookmark.id);
        indicator.onclick = (e) => { e.stopPropagation(); showCommentModal(bookmark.id, lastSpan.getBoundingClientRect()); };
        lastSpan.appendChild(indicator);
      }
      if (bookmark.isConfirmed && bookmark.tags && bookmark.tags.length > 0) {
        const indicator = document.createElement('span');
        indicator.innerHTML = createIndicatorSvg('tag', bookmark.id);
        indicator.onclick = (e) => { e.stopPropagation(); showTagModal(bookmark.id, lastSpan.getBoundingClientRect()); };
        lastSpan.appendChild(indicator);
      }
    });

    if (bookmarksToRemove.length > 0) {
      bookmarksToRemove.forEach(id => removeBookmark(id));
    }
    // Clear any leftover selection ranges from the process.
    window.getSelection()?.removeAllRanges();
  }, [htmlContent, currentMailBookmarks, deserializeRange, showPopup, removeBookmark, showCommentModal, showTagModal]);


  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!contentRef.current) return;

    // The popup opening is delayed slightly to allow other 'click' or 'mousedown' events
    // (like hidePopup) to resolve first. This prevents race conditions.
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      // Ignore clicks inside popups or modals.
      const targetElement = event.target as HTMLElement;
      if (targetElement.closest('.selection-popup-class-name, .comment-modal-root-class, .tag-modal-root-class')) {
        return;
      }

      const range = selection.getRangeAt(0);
      const text = range.toString().trim();

      // Ensure the selection is valid and within the content area.
      if (text.length > 0 && contentRef.current?.contains(range.commonAncestorContainer)) {
        const rect = range.getBoundingClientRect();
        const newBookmark = addBookmark(text, range, contentRef.current, mailId);
        if (newBookmark) {
          showPopup(newBookmark.id, rect);
        }
      }
      // It's good practice to clear the selection after processing it.
      // But we will let the user do it
      // selection.removeAllRanges(); 
    }, 10); // A small delay is usually sufficient.

  }, [addBookmark, showPopup, mailId]);

  useEffect(() => {
    const currentContentElement = contentRef.current;
    if (currentContentElement) {
      // Use document-level mouseup for creating highlights.
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseUp]);

  return (
    <div
      ref={contentRef}
      style={{ wordBreak: 'break-word', hyphens: 'auto' }}
      className="prose text-sm prose-sm dark:prose-invert max-w-none"
    />
  );
};

export default MailBodyViewer;