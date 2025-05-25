"use client";

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useBookmarks } from '@/context/bookmarkContext'; // Adjust path

interface MailBodyViewerProps {
  htmlContent: string;
  mailId?: string;
}

// SVG for the comment indicator
const createCommentIndicatorSvg = (bookmarkId: string) => `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 16 16"
     height="13"
     width="13"
     class="comment-indicator-icon-svg"
     data-bookmark-id="${bookmarkId}" 
     style="margin: 0 4px; fill: currentColor; display: inline-block; cursor: pointer;">
  <path d="M5 2C3.34315 2 2 3.34315 2 5V9C2 10.6569 3.34315 12 5 12H6L8 15L10 12H11C12.6569 12 14 10.6569 14 9V5C14 3.34315 12.6569 2 11 2H5Z"></path>
</svg>
`;

const MailBodyViewer: React.FC<MailBodyViewerProps> = ({ htmlContent, mailId }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    bookmarks,
    addBookmark,
    showPopup,
    deserializeRange,
    removeBookmark,
    showCommentModal, // <<< Import showCommentModal
  } = useBookmarks();

  const currentMailBookmarks = useMemo(() => {
    return mailId ? bookmarks.filter(b => b.mailId === mailId) : bookmarks;
  }, [bookmarks, mailId]);

  useEffect(() => {
    if (!contentRef.current || !htmlContent) return;

    contentRef.current.innerHTML = htmlContent;

    const sortedBookmarks = [...currentMailBookmarks].sort((a, b) => {
      // ... (sorting logic remains the same)
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
          if (range.collapsed || !contentRef.current.contains(range.commonAncestorContainer)) {
            bookmarksToRemove.push(bookmark.id);
            return;
          }

          const highlightSpan = document.createElement('span'); // Renamed to highlightSpan for clarity
          highlightSpan.className = 'bookmark-highlight';
          highlightSpan.dataset.bookmarkId = bookmark.id;

          let mouseDownX = 0, mouseDownY = 0;
          highlightSpan.onmousedown = (e) => {
            // Only set mouseDown for the highlight span itself, not its children like the icon
            if (e.target === highlightSpan || (e.target as Node).parentNode === highlightSpan && !(e.target as HTMLElement).closest('.comment-indicator')) {
              e.stopPropagation();
              mouseDownX = e.clientX;
              mouseDownY = e.clientY;
            }
          };
          highlightSpan.onclick = (e) => {
            // Prevent opening selection popup if the click was on the comment icon
            if ((e.target as HTMLElement).closest('.comment-indicator')) {
              e.stopPropagation();
              return;
            }
            e.stopPropagation();
            const MOUSE_CLICK_THRESHOLD = 5;
            if (Math.abs(e.clientX - mouseDownX) < MOUSE_CLICK_THRESHOLD &&
              Math.abs(e.clientY - mouseDownY) < MOUSE_CLICK_THRESHOLD) {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              showPopup(bookmark.id, rect);
            }
          };

          const contents = range.extractContents();
          highlightSpan.appendChild(contents);
          range.insertNode(highlightSpan);

          if (bookmark.comment && bookmark.comment.trim() !== "") {
            const commentIndicatorWrapper = document.createElement('span');
            commentIndicatorWrapper.className = 'comment-indicator';
            commentIndicatorWrapper.innerHTML = createCommentIndicatorSvg(bookmark.id); // Pass bookmark.id

            // Get the actual SVG element to attach the click listener
            const svgIcon = commentIndicatorWrapper.querySelector('.comment-indicator-icon-svg');
            if (svgIcon) {
              svgIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // IMPORTANT: Stop propagation to prevent highlightSpan's onclick
                const targetBookmarkId = (e.currentTarget as HTMLElement).dataset.bookmarkId;
                if (targetBookmarkId) {
                  // Use the highlightSpan's rect for consistent modal positioning
                  const rect = highlightSpan.getBoundingClientRect();
                  showCommentModal(targetBookmarkId, rect);
                }
              });
            }
            highlightSpan.appendChild(commentIndicatorWrapper);
          }

        } catch (error) {
          // ... (error handling remains the same)
          console.error(`Error applying highlight for bookmark ${bookmark.id}:`, error);
          if (error instanceof DOMException && error.name === 'NotFoundError') {
            bookmarksToRemove.push(bookmark.id);
          }
        }
      } else {
        // ... (logic for non-deserializable range remains the same)
        bookmarksToRemove.push(bookmark.id);
      }
    });

    if (bookmarksToRemove.length > 0) {
      bookmarksToRemove.forEach(id => removeBookmark(id));
    }
    window.getSelection()?.removeAllRanges();
  }, [htmlContent, currentMailBookmarks, deserializeRange, showPopup, removeBookmark, showCommentModal]); // <<< Add showCommentModal to dependencies

  // ... (handleMouseUp and other useEffects remain the same)
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!contentRef.current) return;

    // Updated condition to be more robust for preventing mouseup when clicking on interactive elements within highlight
    if ((event.target as HTMLElement).closest('.bookmark-highlight .comment-indicator') ||
      (event.target as HTMLElement).closest('.selection-popup-class-name') || // Add class to SelectionPopup root
      (event.target as HTMLElement).closest('.comment-modal-root-class') // Add class to CommentModal root
    ) {
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0).cloneRange();
      const text = selection.toString().trim();

      if (text.length === 0) {
        selection.removeAllRanges();
        return;
      }
      if (!contentRef.current.contains(range.commonAncestorContainer) ||
        (range.commonAncestorContainer === contentRef.current &&
          range.startOffset === range.endOffset &&
          range.startOffset === 0 &&
          contentRef.current.childNodes.length === 0)
      ) {
        selection.removeAllRanges();
        return;
      }

      let current = range.commonAncestorContainer;
      let insideExistingHighlight = false;
      while (current && current !== contentRef.current) {
        if (current.nodeType === Node.ELEMENT_NODE && (current as HTMLElement).classList?.contains('bookmark-highlight')) {
          insideExistingHighlight = true;
          break;
        }
        current = current.parentNode as Node;
      }
      // Allow selecting text even if it's partially within a highlight,
      // but if the click to *start* the selection was on a comment icon, we've already handled it.
      // The main purpose here is to prevent creating a *new* bookmark if the selection is trivial or problematic.
      if (insideExistingHighlight && text === (current as HTMLElement)?.textContent?.trim()) {
        // If the selection is exactly an existing highlight, let its own click handler manage it.
        selection.removeAllRanges();
        return;
      }


      const rect = range.getBoundingClientRect();
      const newBookmark = addBookmark(text, range, contentRef.current, mailId);
      if (newBookmark) {
        showPopup(newBookmark.id, rect);
      }
      selection.removeAllRanges();
    }
  }, [addBookmark, showPopup, mailId]);

  useEffect(() => {
    const currentContentElement = contentRef.current;
    if (currentContentElement) {
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
    />
  );
};

export default MailBodyViewer;