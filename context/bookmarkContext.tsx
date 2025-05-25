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
  comment?: string;
  tags?: string[]; // New: For storing tags
}

interface ActivePopupData {
  bookmarkId: string;
  rect: DOMRect;
}

interface ActiveCommentModalData {
  bookmarkId: string;
  rect: DOMRect;
}

interface ActiveTagModalData { // New: For tag modal
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

  activeCommentModal: ActiveCommentModalData | null;
  showCommentModal: (bookmarkId: string, rect: DOMRect) => void;
  hideCommentModal: () => void;
  addOrUpdateComment: (bookmarkId: string, commentText: string) => void;

  // New: Tag related properties and functions
  allTags: string[];
  activeTagModal: ActiveTagModalData | null;
  showTagModal: (bookmarkId: string, rect: DOMRect) => void;
  hideTagModal: () => void;
  updateBookmarkTags: (bookmarkId: string, tags: string[]) => void;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]); // Store all unique tags
  const [activePopup, setActivePopup] = useState<ActivePopupData | null>(null);
  const [activeCommentModal, setActiveCommentModal] = useState<ActiveCommentModalData | null>(null);
  const [activeTagModal, setActiveTagModal] = useState<ActiveTagModalData | null>(null); // New state for tags

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
      comment: undefined,
      tags: [], // Initialize tags as an empty array
    };
    setBookmarks(prev => [...prev, newBookmark]);
    return newBookmark;
  }, [getSerializedRange]);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    if (activePopup?.bookmarkId === bookmarkId) {
      setActivePopup(null);
    }
    if (activeCommentModal?.bookmarkId === bookmarkId) {
      setActiveCommentModal(null);
    }
    if (activeTagModal?.bookmarkId === bookmarkId) { // Close tag modal if associated bookmark is removed
      setActiveTagModal(null);
    }
  }, [activePopup, activeCommentModal, activeTagModal]);

  const getBookmarkById = useCallback((bookmarkId: string) => {
    return bookmarks.find(b => b.id === bookmarkId);
  }, [bookmarks]);

  const showPopup = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActivePopup({ bookmarkId, rect });
    setActiveCommentModal(null); // Hide comment modal
    setActiveTagModal(null); // Hide tag modal
  }, []);

  const hidePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  const showCommentModal = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActiveCommentModal({ bookmarkId, rect });
    setActivePopup(null); // Hide selection popup
    setActiveTagModal(null); // Hide tag modal
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

  // New: Tag modal functions
  const showTagModal = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActiveTagModal({ bookmarkId, rect });
    setActivePopup(null); // Hide selection popup
    setActiveCommentModal(null); // Hide comment modal
  }, []);

  const hideTagModal = useCallback(() => {
    setActiveTagModal(null);
  }, []);

  const updateBookmarkTags = useCallback((bookmarkId: string, newTags: string[]) => {
    // Normalize, clean, and remove duplicates from incoming tags for the bookmark
    const normalizedCleanedBookmarkTags = Array.from(new Set(newTags.map(t => t.toLowerCase().trim()).filter(t => t.length > 0))).sort();

    setBookmarks(prevBookmarks =>
      prevBookmarks.map(b =>
        b.id === bookmarkId ? { ...b, tags: normalizedCleanedBookmarkTags } : b
      )
    );
    setAllTags(prevAllTags => {
      // Add new tags to the global list of all tags, ensuring uniqueness and normalization
      const updatedAllTags = new Set([...prevAllTags, ...normalizedCleanedBookmarkTags]);
      return Array.from(updatedAllTags).sort();
    });
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
      activeCommentModal,
      showCommentModal,
      hideCommentModal,
      addOrUpdateComment,
      // New: Expose tag-related items
      allTags,
      activeTagModal,
      showTagModal,
      hideTagModal,
      updateBookmarkTags,
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