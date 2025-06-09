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
     style="margin: 0 2px; fill: currentColor; display: inline-block; cursor: pointer;">
  <path d="M5 2C3.34315 2 2 3.34315 2 5V9C2 10.6569 3.34315 12 5 12H6L8 15L10 12H11C12.6569 12 14 10.6569 14 9V5C14 3.34315 12.6569 2 11 2H5Z"></path>
</svg>
`;

// SVG for the tag indicator
const createTagIndicatorSvg = (bookmarkId: string) => `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 16 16"
     height="13"
     width="13"
     class="tag-indicator-icon-svg"
     data-bookmark-id="${bookmarkId}"
     style="margin: 0 2px; fill: currentColor; display: inline-block; cursor: pointer;">
  <path d="M13.5858 7.58579L8.58579 2.58579C8.21071 2.21071 7.70201 2 7.17157 2H4C2.89543 2 2 2.89543 2 4V7.17157C2 7.70201 2.21071 8.21071 2.58579 8.58579L7.58579 13.5858C8.36684 14.3668 9.63316 14.3668 10.4142 13.5858L13.5858 10.4142C14.3668 9.63317 14.3668 8.36684 13.5858 7.58579ZM6 7C6.55228 7 7 6.55228 7 6C7 5.44771 6.55228 5 6 5C5.44772 5 5 5.44771 5 6C5 6.55228 5.44772 7 6 7Z"
        clip-rule="evenodd" fill-rule="evenodd"></path>
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
    showCommentModal,
    showTagModal, // <<< Import showTagModal
  } = useBookmarks();

  const currentMailBookmarks = useMemo(() => {
    return mailId ? bookmarks.filter(b => b.mailId === mailId) : bookmarks;
  }, [bookmarks, mailId]);

  useEffect(() => {
    if (!contentRef.current || !htmlContent) return;

    contentRef.current.innerHTML = htmlContent;

    const sortedBookmarks = [...currentMailBookmarks].sort((a, b) => {
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

          const highlightSpan = document.createElement('span');
          highlightSpan.className = 'bookmark-highlight';
          highlightSpan.dataset.bookmarkId = bookmark.id;

          let mouseDownX = 0, mouseDownY = 0;
          highlightSpan.onmousedown = (e) => {
            if (e.target === highlightSpan || (e.target as Node).parentNode === highlightSpan &&
              !((e.target as HTMLElement).closest('.comment-indicator') || (e.target as HTMLElement).closest('.tag-indicator'))
            ) {
              e.stopPropagation();
              mouseDownX = e.clientX;
              mouseDownY = e.clientY;
            }
          };
          highlightSpan.onclick = (e) => {
            if ((e.target as HTMLElement).closest('.comment-indicator') || (e.target as HTMLElement).closest('.tag-indicator')) {
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
            commentIndicatorWrapper.innerHTML = createCommentIndicatorSvg(bookmark.id);

            const svgIcon = commentIndicatorWrapper.querySelector('.comment-indicator-icon-svg');
            if (svgIcon) {
              svgIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetBookmarkId = (e.currentTarget as HTMLElement).dataset.bookmarkId;
                if (targetBookmarkId) {
                  const rect = highlightSpan.getBoundingClientRect();
                  showCommentModal(targetBookmarkId, rect);
                }
              });
            }
            highlightSpan.appendChild(commentIndicatorWrapper);
          }

          // New: Add tag indicator if tags exist
          if (bookmark.tags && bookmark.tags.length > 0) {
            const tagIndicatorWrapper = document.createElement('span');
            tagIndicatorWrapper.className = 'tag-indicator';
            tagIndicatorWrapper.innerHTML = createTagIndicatorSvg(bookmark.id);

            const svgIcon = tagIndicatorWrapper.querySelector('.tag-indicator-icon-svg');
            if (svgIcon) {
              svgIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetBookmarkId = (e.currentTarget as HTMLElement).dataset.bookmarkId;
                if (targetBookmarkId) {
                  const rect = highlightSpan.getBoundingClientRect();
                  showTagModal(targetBookmarkId, rect);
                }
              });
            }
            // Append after comment indicator or directly to highlightSpan
            const existingCommentIndicator = highlightSpan.querySelector('.comment-indicator');
            if (existingCommentIndicator) {
              if (existingCommentIndicator.nextSibling) {
                existingCommentIndicator.parentNode?.insertBefore(tagIndicatorWrapper, existingCommentIndicator.nextSibling);
              } else {
                existingCommentIndicator.parentNode?.appendChild(tagIndicatorWrapper);
              }
            } else {
              highlightSpan.appendChild(tagIndicatorWrapper);
            }
          }

        } catch (error) {
          console.error(`Error applying highlight for bookmark ${bookmark.id}:`, error);
          if (error instanceof DOMException && error.name === 'NotFoundError') {
            bookmarksToRemove.push(bookmark.id);
          }
        }
      } else {
        bookmarksToRemove.push(bookmark.id);
      }
    });

    // if (bookmarksToRemove.length > 0) {
    //   bookmarksToRemove.forEach(id => removeBookmark(id));
    // }
    window.getSelection()?.removeAllRanges();
  }, [htmlContent, currentMailBookmarks, deserializeRange, showPopup, removeBookmark, showCommentModal, showTagModal]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!contentRef.current) return;

    if ((event.target as HTMLElement).closest('.bookmark-highlight .comment-indicator') ||
      (event.target as HTMLElement).closest('.bookmark-highlight .tag-indicator') || // Added this
      (event.target as HTMLElement).closest('.selection-popup-class-name') ||
      (event.target as HTMLElement).closest('.comment-modal-root-class') ||
      (event.target as HTMLElement).closest('.tag-modal-root-class') // Added this
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
      if (insideExistingHighlight && text === (current as HTMLElement)?.textContent?.trim()) {
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
      style={{ wordBreak: 'break-word', hyphens: 'auto' }}
      className="prose text-sm prose-sm dark:prose-invert max-w-none "
    />
  );
};

export default MailBodyViewer;