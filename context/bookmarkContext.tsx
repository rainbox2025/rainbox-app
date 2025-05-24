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
    // This can happen if node is not a descendant, or if root is not an ancestor.
    // Or if node is the root itself, path would be empty.
    // For this application, an error or empty path might be fine if node IS root.
    // However, range boundaries are typically *within* root.
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
}

interface ActivePopupData {
  bookmarkId: string;
  rect: DOMRect; // Use DOMRect for full positioning info
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
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [activePopup, setActivePopup] = useState<ActivePopupData | null>(null);

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
        // Validate offsets against node lengths
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
    };
    setBookmarks(prev => {
      // Prevent duplicate bookmarks if range is identical (optional, based on needs)
      // const existing = prev.find(b => JSON.stringify(b.serializedRange) === JSON.stringify(sRange) && b.mailId === mailId);
      // if (existing) return prev;
      return [...prev, newBookmark];
    });
    return newBookmark;
  }, [getSerializedRange]); // getSerializedRange is stable

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    if (activePopup?.bookmarkId === bookmarkId) {
      setActivePopup(null);
    }
  }, [activePopup]);

  const getBookmarkById = useCallback((bookmarkId: string) => {
    return bookmarks.find(b => b.id === bookmarkId);
  }, [bookmarks]);

  const showPopup = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActivePopup({ bookmarkId, rect });
  }, []);

  const hidePopup = useCallback(() => {
    setActivePopup(null);
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
      deserializeRange
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