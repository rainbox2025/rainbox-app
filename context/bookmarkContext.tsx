"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
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
    console.warn("Node is not a descendant of the root element.");
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
  tags?: string[];
  createdAt?: number;
  isConfirmed?: boolean;
}

interface ActivePopupData {
  bookmarkId: string;
  rect: DOMRect;
}

interface ActiveCommentModalData {
  bookmarkId: string;
  rect: DOMRect;
}

interface ActiveTagModalData {
  bookmarkId: string;
  rect: DOMRect;
}

interface BookmarkContextType {
  bookmarks: Bookmark[];
  isLoading: boolean;
  addBookmark: (text: string, range: Range, rootElement: HTMLElement, mailId?: string) => Bookmark | null;
  removeBookmark: (bookmarkId: string) => void;
  confirmBookmark: (bookmarkId: string) => void;
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
  allTags: string[];
  activeTagModal: ActiveTagModalData | null;
  showTagModal: (bookmarkId: string, rect: DOMRect) => void;
  hideTagModal: () => void;
  updateBookmarkTags: (bookmarkId: string, tags: string[]) => void;
  renameTagGlobally: (oldTag: string, newTag: string) => void;
  deleteTagGlobally: (tagToDelete: string) => void;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);
const BOOKMARKS_STORAGE_KEY = 'rainboxApp_bookmarks';

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePopup, setActivePopup] = useState<ActivePopupData | null>(null);
  const [activeCommentModal, setActiveCommentModal] = useState<ActiveCommentModalData | null>(null);
  const [activeTagModal, setActiveTagModal] = useState<ActiveTagModalData | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (storedBookmarks) {
          const parsedBookmarks = JSON.parse(storedBookmarks);
          setBookmarks(parsedBookmarks.filter((b: Bookmark) => b.isConfirmed !== false));
        }
      } catch (error) {
        console.error("Error loading bookmarks from localStorage:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      const bookmarksToSave = bookmarks.filter(b => b.isConfirmed !== false);
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarksToSave));
    }
  }, [bookmarks, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      const derivedTags = Array.from(
        new Set(bookmarks.flatMap(b => b.tags || []).map(t => t.toLowerCase().trim()).filter(t => t))
      ).sort();
      setAllTags(derivedTags);
    }
  }, [bookmarks, isLoading]);

  const getSerializedRange = useCallback((range: Range, rootElement: HTMLElement): SerializedRange | null => {
    try {
      return {
        start: { path: getNodePath(range.startContainer, rootElement), offset: range.startOffset },
        end: { path: getNodePath(range.endContainer, rootElement), offset: range.endOffset },
      };
    } catch (error) {
      console.error("Error serializing range:", error); return null;
    }
  }, []);

  const deserializeRange = useCallback((serializedRange: SerializedRange, rootElement: HTMLElement): Range | null => {
    try {
      const startNode = getNodeFromPath(serializedRange.start.path, rootElement);
      const endNode = getNodeFromPath(serializedRange.end.path, rootElement);

      if (startNode && endNode) {
        const range = document.createRange();
        const validStartOffset = Math.min(serializedRange.start.offset, startNode.nodeValue?.length ?? startNode.childNodes.length);
        const validEndOffset = Math.min(serializedRange.end.offset, endNode.nodeValue?.length ?? endNode.childNodes.length);
        range.setStart(startNode, validStartOffset);
        range.setEnd(endNode, validEndOffset);
        return range;
      }
      return null;
    } catch (error) {
      console.error("Error deserializing range:", error); return null;
    }
  }, []);

  const addBookmark = useCallback((text: string, range: Range, rootElement: HTMLElement, mailId?: string): Bookmark | null => {
    const sRange = getSerializedRange(range, rootElement);
    if (!sRange) return null;

    const newBookmark: Bookmark = {
      id: uuidv4(), text, serializedRange: sRange, mailId,
      createdAt: Date.now(), isConfirmed: false,
    };
    setBookmarks(prev => [...prev.filter(b => b.isConfirmed), newBookmark]);
    return newBookmark;
  }, [getSerializedRange]);

  const confirmBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, isConfirmed: true } : b));
  }, []);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    if (activePopup?.bookmarkId === bookmarkId) setActivePopup(null);
    if (activeCommentModal?.bookmarkId === bookmarkId) setActiveCommentModal(null);
    if (activeTagModal?.bookmarkId === bookmarkId) setActiveTagModal(null);
  }, [activePopup, activeCommentModal, activeTagModal]);

  const getBookmarkById = useCallback((bookmarkId: string) => bookmarks.find(b => b.id === bookmarkId), [bookmarks]);

  const showPopup = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActivePopup({ bookmarkId, rect });
    setActiveCommentModal(null);
    setActiveTagModal(null);
  }, []);

  const hidePopup = useCallback(() => {
    if (activePopup) {
      const bookmark = getBookmarkById(activePopup.bookmarkId);
      if (bookmark && !bookmark.isConfirmed) {
        removeBookmark(bookmark.id);
      }
    }
    setActivePopup(null)
  }, [activePopup, getBookmarkById, removeBookmark]);

  const showCommentModal = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActiveCommentModal({ bookmarkId, rect });
    setActivePopup(null);
    setActiveTagModal(null);
  }, []);

  const hideCommentModal = useCallback(() => setActiveCommentModal(null), []);

  const addOrUpdateComment = useCallback((bookmarkId: string, commentText: string) => {
    setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, comment: commentText.trim() || undefined, isConfirmed: true } : b));
  }, []);

  const showTagModal = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActiveTagModal({ bookmarkId, rect });
    setActivePopup(null);
    setActiveCommentModal(null);
  }, []);

  const hideTagModal = useCallback(() => setActiveTagModal(null), []);

  const updateBookmarkTags = useCallback((bookmarkId: string, newTags: string[]) => {
    const cleanedTags = Array.from(new Set(newTags.map(t => t.toLowerCase().trim()).filter(Boolean))).sort();
    setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, tags: cleanedTags, isConfirmed: true } : b));
  }, []);

  const renameTagGlobally = useCallback((oldTag: string, newTag: string) => {
    const o = oldTag.toLowerCase().trim();
    const n = newTag.toLowerCase().trim();
    if (!o || !n || o === n) return;
    setBookmarks(prev => prev.map(bm => ({ ...bm, tags: Array.from(new Set((bm.tags || []).map(t => t.toLowerCase().trim() === o ? n : t))).sort() })));
  }, []);

  const deleteTagGlobally = useCallback((tagToDelete: string) => {
    const t = tagToDelete.toLowerCase().trim();
    if (!t) return;
    setBookmarks(prev => prev.map(bm => ({ ...bm, tags: (bm.tags || []).filter(tag => tag.toLowerCase().trim() !== t).sort() })));
  }, []);

  return (
    <BookmarkContext.Provider value={{
      bookmarks, isLoading, addBookmark, removeBookmark, confirmBookmark, getBookmarkById,
      activePopup, showPopup, hidePopup, getSerializedRange, deserializeRange,
      activeCommentModal, showCommentModal, hideCommentModal, addOrUpdateComment,
      allTags, activeTagModal, showTagModal, hideTagModal, updateBookmarkTags,
      renameTagGlobally, deleteTagGlobally,
    }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = (): BookmarkContextType => {
  const context = useContext(BookmarkContext);
  if (!context) throw new Error('useBookmarks must be used within a BookmarkProvider');
  return context;
};