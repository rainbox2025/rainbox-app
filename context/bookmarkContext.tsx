"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Helper: Get path from node to root
const getNodePath = (node: Node, root: Node): number[] => {
  const path: number[] = [];
  let currentNode: Node | null = node;
  while (currentNode && currentNode !== root && currentNode.parentNode) {
    const parent: Node = currentNode.parentNode;
    path.unshift(Array.prototype.indexOf.call(parent.childNodes, currentNode));
    currentNode = parent;
  }
  if (currentNode !== root) {
    if (node !== root) throw new Error("Node is not a descendant of the root element or root itself.");
  }
  return path;
};

// Helper: Get node from path relative to root
const getNodeFromPath = (path: number[], root: Node): Node | null => {
  let node: Node | null = root;
  for (const index of path) {
    if (!node || !node.childNodes[index]) return null;
    node = node.childNodes[index];
  }
  return node;
};

interface SerializedRangeNode {
  path: number[];
  offset: number;
}

interface SerializedRange {
  start: SerializedRangeNode;
  end: SerializedRangeNode;
}

export interface Bookmark {
  id: string;
  text: string;
  serializedRange: SerializedRange;
  mailId?: string;
  comment?: string; // New: For storing comments
}

interface ActivePopupData {
  bookmarkId: string;
  rect: DOMRect;
}

interface ActiveCommentModalData { // New: For comment modal
  bookmarkId: string;
  rect: DOMRect;
}

interface BookmarkContextType {
  bookmarks: Bookmark[];
  addBookmark: (text: string, range: Range, rootElement: HTMLElement, mailId?: string) => Bookmark | null;
  removeBookmark: (bookmarkId: string) => void;
  getBookmarkById: (bookmarkId: string) => Bookmark | undefined;

  activePopup: ActivePopupData | null;
  showPopup: (bookmarkId: string, rect: DOMRect) => void;
  hidePopup: () => void;

  getSerializedRange: (range: Range, rootElement: HTMLElement) => SerializedRange | null;
  deserializeRange: (serializedRange: SerializedRange, rootElement: HTMLElement) => Range | null;

  // New: Comment related properties and functions
  activeCommentModal: ActiveCommentModalData | null;
  showCommentModal: (bookmarkId: string, rect: DOMRect) => void;
  hideCommentModal: () => void;
  addOrUpdateComment: (bookmarkId: string, commentText: string) => void;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [activePopup, setActivePopup] = useState<ActivePopupData | null>(null);
  const [activeCommentModal, setActiveCommentModal] = useState<ActiveCommentModalData | null>(null); // New state

  const getSerializedRange = useCallback((range: Range, rootElement: HTMLElement): SerializedRange | null => {
    try {
      const startNodePath = getNodePath(range.startContainer, rootElement);
      const endNodePath = getNodePath(range.endContainer, rootElement);
      return {
        start: { path: startNodePath, offset: range.startOffset },
        end: { path: endNodePath, offset: range.endOffset },
      };
    } catch (error) {
      console.error("Error serializing range:", error);
      return null;
    }
  }, []);

  const deserializeRange = useCallback((serializedRange: SerializedRange, rootElement: HTMLElement): Range | null => {
    try {
      const startNode = getNodeFromPath(serializedRange.start.path, rootElement);
      const endNode = getNodeFromPath(serializedRange.end.path, rootElement);

      if (startNode && endNode) {
        const range = document.createRange();
        const startOffset = Math.min(serializedRange.start.offset, startNode.nodeValue?.length ?? (startNode.childNodes?.length || 0));
        const endOffset = Math.min(serializedRange.end.offset, endNode.nodeValue?.length ?? (endNode.childNodes?.length || 0));

        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return range;
      }
      console.warn("Could not find nodes for deserializing range:", serializedRange);
      return null;
    } catch (error) {
      console.error("Error deserializing range:", error);
      return null;
    }
  }, []);

  const addBookmark = useCallback((text: string, range: Range, rootElement: HTMLElement, mailId?: string): Bookmark | null => {
    const sRange = getSerializedRange(range, rootElement);
    if (!sRange) {
      console.error("Failed to serialize range for new bookmark.");
      return null;
    }

    const newBookmark: Bookmark = {
      id: uuidv4(),
      text,
      serializedRange: sRange,
      mailId,
      comment: undefined, // Initialize comment as undefined
    };
    setBookmarks(prev => [...prev, newBookmark]);
    return newBookmark;
  }, [getSerializedRange]);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    if (activePopup?.bookmarkId === bookmarkId) {
      setActivePopup(null);
    }
    if (activeCommentModal?.bookmarkId === bookmarkId) { // New: Close comment modal if associated bookmark is removed
      setActiveCommentModal(null);
    }
  }, [activePopup, activeCommentModal]);

  const getBookmarkById = useCallback((bookmarkId: string) => {
    return bookmarks.find(b => b.id === bookmarkId);
  }, [bookmarks]);

  const showPopup = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActivePopup({ bookmarkId, rect });
    setActiveCommentModal(null); // Hide comment modal if selection popup is shown
  }, []);

  const hidePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  // New: Comment modal functions
  const showCommentModal = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActiveCommentModal({ bookmarkId, rect });
    setActivePopup(null); // Hide selection popup when comment modal is shown
  }, []);

  const hideCommentModal = useCallback(() => {
    setActiveCommentModal(null);
  }, []);

  const addOrUpdateComment = useCallback((bookmarkId: string, commentText: string) => {
    setBookmarks(prev =>
      prev.map(b =>
        b.id === bookmarkId
          ? { ...b, comment: commentText.trim() ? commentText.trim() : undefined }
          : b
      )
    );
  }, []);

  return (
    <BookmarkContext.Provider value={{
      bookmarks,
      addBookmark,
      removeBookmark,
      getBookmarkById,
      activePopup,
      showPopup,
      hidePopup,
      getSerializedRange,
      deserializeRange,
      // New: Expose comment-related items
      activeCommentModal,
      showCommentModal,
      hideCommentModal,
      addOrUpdateComment,
    }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = (): BookmarkContextType => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};