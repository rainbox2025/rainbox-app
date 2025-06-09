"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Helper: Get path from node to root (remains the same)
const getNodePath = (node: Node, root: Node): number[] => {
  const path: number[] = [];
  let currentNode: Node | null = node;
  while (currentNode && currentNode !== root && currentNode.parentNode) {
    const parent: Node = currentNode.parentNode;
    path.unshift(Array.prototype.indexOf.call(parent.childNodes, currentNode));
    currentNode = parent;
  }
  if (currentNode !== root) {
    if (node !== root) console.warn("Node is not a descendant of the root element or root itself.");
    // Soft error for cases where root might be tricky, e.g., shadow DOM or dynamic content
  }
  return path;
};

// Helper: Get node from path relative to root (remains the same)
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
  isLoading: boolean; // To indicate loading from localStorage
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
const ALL_TAGS_STORAGE_KEY = 'rainboxApp_allTags'; // Though allTags will be derived, we can persist it for quicker load.

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  const [activePopup, setActivePopup] = useState<ActivePopupData | null>(null);
  const [activeCommentModal, setActiveCommentModal] = useState<ActiveCommentModalData | null>(null);
  const [activeTagModal, setActiveTagModal] = useState<ActiveTagModalData | null>(null);

  // Load bookmarks and tags from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (storedBookmarks) {
          setBookmarks(JSON.parse(storedBookmarks));
        }
        // AllTags will be derived from bookmarks, but we can load a persisted version first
        // const storedTags = localStorage.getItem(ALL_TAGS_STORAGE_KEY);
        // if (storedTags) {
        //   setAllTags(JSON.parse(storedTags));
        // }
      } catch (error) {
        console.error("Error loading bookmarks from localStorage:", error);
        // Optionally clear corrupted data
        // localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
        // localStorage.removeItem(ALL_TAGS_STORAGE_KEY);
      } finally {
        setIsLoading(false); // Set loading to false after attempting to load
      }
    } else {
      setIsLoading(false); // Not in browser, no localStorage
    }
  }, []);

  // Persist bookmarks to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) { // Don't save during initial load
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    }
  }, [bookmarks, isLoading]);

  // Derive and persist allTags whenever bookmarks change
  useEffect(() => {
    if (!isLoading) {
      const derivedTags = Array.from(
        new Set(bookmarks.flatMap(b => b.tags || []).map(t => t.toLowerCase().trim()).filter(t => t))
      ).sort();
      setAllTags(derivedTags);
    }
  }, [bookmarks, isLoading]);

  // Persist allTags to localStorage whenever it changes (after being derived)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading && allTags.length > 0) { // Avoid saving empty array unnecessarily during init
      localStorage.setItem(ALL_TAGS_STORAGE_KEY, JSON.stringify(allTags));
    } else if (typeof window !== 'undefined' && !isLoading && allTags.length === 0) {
      localStorage.removeItem(ALL_TAGS_STORAGE_KEY); // Clean up if no tags
    }
  }, [allTags, isLoading]);


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
        const validStartOffset = Math.min(serializedRange.start.offset, startNode.nodeValue?.length ?? (startNode.childNodes?.length || 0));
        const validEndOffset = Math.min(serializedRange.end.offset, endNode.nodeValue?.length ?? (endNode.childNodes?.length || 0));

        range.setStart(startNode, validStartOffset);
        range.setEnd(endNode, validEndOffset);
        return range;
      }
      console.warn("Could not find nodes for deserializing range:", serializedRange, "in root:", rootElement);
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
      tags: [],
      createdAt: Date.now(),
    };
    setBookmarks(prev => [...prev, newBookmark].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))); // Example sort by newest
    return newBookmark;
  }, [getSerializedRange]);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    if (activePopup?.bookmarkId === bookmarkId) setActivePopup(null);
    if (activeCommentModal?.bookmarkId === bookmarkId) setActiveCommentModal(null);
    if (activeTagModal?.bookmarkId === bookmarkId) setActiveTagModal(null);
  }, [activePopup, activeCommentModal, activeTagModal]);

  const getBookmarkById = useCallback((bookmarkId: string) => {
    return bookmarks.find(b => b.id === bookmarkId);
  }, [bookmarks]);

  const showPopup = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActivePopup({ bookmarkId, rect });
    setActiveCommentModal(null);
    setActiveTagModal(null);
  }, []);

  const hidePopup = useCallback(() => setActivePopup(null), []);

  const showCommentModal = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActiveCommentModal({ bookmarkId, rect });
    setActivePopup(null);
    setActiveTagModal(null);
  }, []);

  const hideCommentModal = useCallback(() => setActiveCommentModal(null), []);

  const addOrUpdateComment = useCallback((bookmarkId: string, commentText: string) => {
    setBookmarks(prev =>
      prev.map(b =>
        b.id === bookmarkId
          ? { ...b, comment: commentText.trim() ? commentText.trim() : undefined }
          : b
      )
    );
  }, []);

  const showTagModal = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActiveTagModal({ bookmarkId, rect });
    setActivePopup(null);
    setActiveCommentModal(null);
  }, []);

  const hideTagModal = useCallback(() => setActiveTagModal(null), []);

  const updateBookmarkTags = useCallback((bookmarkId: string, newTags: string[]) => {
    const normalizedCleanedBookmarkTags = Array.from(
      new Set(newTags.map(t => t.toLowerCase().trim()).filter(t => t.length > 0))
    ).sort();

    setBookmarks(prevBookmarks =>
      prevBookmarks.map(b =>
        b.id === bookmarkId ? { ...b, tags: normalizedCleanedBookmarkTags } : b
      )
    );
    // allTags will be updated by the useEffect watching `bookmarks`
  }, []);

  const renameTagGlobally = useCallback((oldTag: string, newTag: string) => {
    const normalizedOldTag = oldTag.toLowerCase().trim();
    const normalizedNewTag = newTag.toLowerCase().trim();

    if (!normalizedOldTag || !normalizedNewTag || normalizedOldTag === normalizedNewTag) return;

    setBookmarks(prevBookmarks =>
      prevBookmarks.map(bm => {
        if (bm.tags?.includes(normalizedOldTag)) {
          const updatedTags = Array.from(new Set(
            (bm.tags || [])
              .map(t => (t.toLowerCase().trim() === normalizedOldTag ? normalizedNewTag : t))
          )).sort();
          return { ...bm, tags: updatedTags };
        }
        return bm;
      })
    );
    // allTags will be updated by the useEffect watching `bookmarks`
  }, []);

  const deleteTagGlobally = useCallback((tagToDelete: string) => {
    const normalizedTagToDelete = tagToDelete.toLowerCase().trim();
    if (!normalizedTagToDelete) return;

    setBookmarks(prevBookmarks =>
      prevBookmarks.map(bm => {
        if (bm.tags?.includes(normalizedTagToDelete)) {
          const updatedTags = (bm.tags || []).filter(t => t.toLowerCase().trim() !== normalizedTagToDelete).sort();
          return { ...bm, tags: updatedTags };
        }
        return bm;
      })
    );
    // allTags will be updated by the useEffect watching `bookmarks`
  }, []);


  return (
    <BookmarkContext.Provider value={{
      bookmarks,
      isLoading,
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
      allTags,
      activeTagModal,
      showTagModal,
      hideTagModal,
      updateBookmarkTags,
      renameTagGlobally,
      deleteTagGlobally,
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