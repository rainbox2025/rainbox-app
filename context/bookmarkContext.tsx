"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { useAxios } from "@/hooks/useAxios";

// --- HELPERS (UNCHANGED) ---
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

const getNodeFromPath = (path: number[], root: Node): Node | null => {
  let node: Node | null = root;
  for (const index of path) {
    if (!node || !node.childNodes[index]) return null;
    node = node.childNodes[index];
  }
  return node;
};

// --- INTERFACES ---

interface SerializedRangeNode {
  path: number[];
  offset: number;
}

interface SerializedRange {
  start: SerializedRangeNode;
  end: SerializedRangeNode;
}

// Interface for the frontend's local state. Uses camelCase and expects objects.
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

// Interface that accurately reflects the raw API JSON response (snake_case, stringified range).
interface ApiBookmark {
  id: string;
  text: string;
  comment?: string;
  created_at: string;
  updated_at?: string;
  mail_id?: string;
  serialized_range: string;
  bookmark_tags: {
    tags: {
      id: string;
      name: string;
    };
  }[];
}

interface TagWithCount {
  id: string;
  name: string;
  count: number;
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
  addBookmark: (
    text: string,
    range: Range,
    rootElement: HTMLElement,
    mailId?: string
  ) => Bookmark | null;
  removeBookmark: (bookmarkId: string) => Promise<void>;
  confirmBookmark: (bookmarkId: string) => Promise<void>;
  getBookmarkById: (bookmarkId: string) => Bookmark | undefined;
  addOrUpdateComment: (bookmarkId: string, commentText: string) => Promise<void>;
  updateBookmarkTags: (bookmarkId: string, tags: string[]) => Promise<void>;
  renameTagGlobally: (oldTag: string, newTag: string) => Promise<void>;
  deleteTagGlobally: (tagToDelete: string) => Promise<void>;
  allTags: string[];
  activePopup: ActivePopupData | null;
  showPopup: (bookmarkId: string, rect: DOMRect) => void;
  hidePopup: () => void;
  activeCommentModal: ActiveCommentModalData | null;
  showCommentModal: (bookmarkId: string, rect: DOMRect) => void;
  hideCommentModal: () => void;
  activeTagModal: ActiveTagModalData | null;
  showTagModal: (bookmarkId: string, rect: DOMRect) => void;
  hideTagModal: () => void;
  getSerializedRange: (
    range: Range,
    rootElement: HTMLElement
  ) => SerializedRange | null;
  deserializeRange: (
    serializedRange: SerializedRange,
    rootElement: HTMLElement
  ) => Range | null;
  isTagRenameLoading: boolean;
  isTagDeleteLoading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(
  undefined
);

// This function is the bridge between the backend data format and the frontend state format.
const mapApiBookmarkToLocal = (apiBookmark: ApiBookmark): Bookmark => {
  let parsedRange: SerializedRange | null = null;
  if (
    apiBookmark.serialized_range &&
    typeof apiBookmark.serialized_range === "string"
  ) {
    try {
      parsedRange = JSON.parse(apiBookmark.serialized_range);
    } catch (e) {
      console.error(`Failed to parse range for bookmark ${apiBookmark.id}`, e);
    }
  }

  return {
    id: apiBookmark.id,
    text: apiBookmark.text,
    serializedRange: parsedRange!,
    mailId: apiBookmark.mail_id,
    comment: apiBookmark.comment || undefined,
    tags: apiBookmark.bookmark_tags?.map((bt) => bt.tags.name).sort() || [],
    createdAt: new Date(apiBookmark.created_at).getTime(),
    isConfirmed: true,
  };
};

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allApiTags, setAllApiTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTagRenameLoading, setIsTagRenameLoading] = useState(false);
  const [isTagDeleteLoading, setIsTagDeleteLoading] = useState(false);
  const [activePopup, setActivePopup] = useState<ActivePopupData | null>(null);
  const [activeCommentModal, setActiveCommentModal] =
    useState<ActiveCommentModalData | null>(null);
  const [activeTagModal, setActiveTagModal] =
    useState<ActiveTagModalData | null>(null);
  const api = useAxios();

  const fetchAllData = useCallback(async () => {
    try {
      const [bookmarksResponse, tagsResponse] = await Promise.all([
        api.get<ApiBookmark[]>("/bookmarks"),
        api.get<TagWithCount[]>("/bookmarks/tags"),
      ]);
      setBookmarks(bookmarksResponse.data.map(mapApiBookmarkToLocal));
      setAllApiTags(tagsResponse.data);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const derivedTags = Array.from(
      new Set(
        bookmarks
          .flatMap((b) => b.tags || [])
          .map((t) => t.toLowerCase().trim())
          .filter(Boolean)
      )
    ).sort();
    setAllTags(derivedTags);
  }, [bookmarks]);

  const getSerializedRange = useCallback(
    (range: Range, rootElement: HTMLElement): SerializedRange | null => {
      try {
        return {
          start: {
            path: getNodePath(range.startContainer, rootElement),
            offset: range.startOffset,
          },
          end: {
            path: getNodePath(range.endContainer, rootElement),
            offset: range.endOffset,
          },
        };
      } catch (error) {
        console.error("Error serializing range:", error);
        return null;
      }
    },
    []
  );

  const deserializeRange = useCallback(
    (
      serializedRange: SerializedRange,
      rootElement: HTMLElement
    ): Range | null => {
      if (!serializedRange?.start || !serializedRange?.end) {
        console.warn("Attempted to deserialize an invalid or null range.");
        return null;
      }
      try {
        const startNode = getNodeFromPath(
          serializedRange.start.path,
          rootElement
        );
        const endNode = getNodeFromPath(serializedRange.end.path, rootElement);

        if (startNode && endNode) {
          const range = document.createRange();
          const validStartOffset = Math.min(
            serializedRange.start.offset,
            startNode.nodeValue?.length ?? startNode.childNodes.length
          );
          const validEndOffset = Math.min(
            serializedRange.end.offset,
            endNode.nodeValue?.length ?? endNode.childNodes.length
          );
          range.setStart(startNode, validStartOffset);
          range.setEnd(endNode, validEndOffset);
          return range;
        }
        return null;
      } catch (error) {
        console.error("Error deserializing range:", error);
        return null;
      }
    },
    []
  );

  const addBookmark = useCallback(
    (
      text: string,
      range: Range,
      rootElement: HTMLElement,
      mailId?: string
    ): Bookmark | null => {
      const sRange = getSerializedRange(range, rootElement);
      if (!sRange) return null;

      const newBookmark: Bookmark = {
        id: uuidv4(),
        text,
        serializedRange: sRange,
        mailId,
        createdAt: Date.now(),
        isConfirmed: false,
      };

      setBookmarks((prev) => [...prev, newBookmark]);
      return newBookmark;
    },
    [getSerializedRange]
  );

  const confirmBookmark = useCallback(
    async (bookmarkId: string) => {
      const bookmarkToConfirm = bookmarks.find((b) => b.id === bookmarkId);
      if (!bookmarkToConfirm) return;

      setBookmarks((prev) =>
        prev.map((b) =>
          b.id === bookmarkId ? { ...b, isConfirmed: true } : b
        )
      );
      try {
        const payload = {
          text: bookmarkToConfirm.text,
          serializedRange: bookmarkToConfirm.serializedRange,
          mailId: bookmarkToConfirm.mailId,
        };
        const { data: serverBookmark } = await api.post<ApiBookmark>(
          "/bookmarks/add",
          { newBookmark: payload }
        );

        setBookmarks((prev) =>
          prev.map((b) =>
            b.id === bookmarkId ? mapApiBookmarkToLocal(serverBookmark) : b
          )
        );
      } catch (error) {
        console.error("Failed to save bookmark:", error);
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      }
    },
    [api, bookmarks]
  );

  const removeBookmark = useCallback(
    async (bookmarkId: string) => {
      const originalBookmarks = bookmarks;
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));

      try {
        await api.delete("/bookmarks/remove", { data: { bookmarkId } });
        await fetchAllData();
      } catch (error) {
        console.error("Failed to remove bookmark:", error);
        setBookmarks(originalBookmarks);
      }

    },
    [api, bookmarks, fetchAllData]
  );

  const getBookmarkById = useCallback(
    (bookmarkId: string) => bookmarks.find((b) => b.id === bookmarkId),
    [bookmarks]
  );

  const addOrUpdateComment = useCallback(
    async (bookmarkId: string, commentText: string) => {
      const originalBookmarks = bookmarks;
      const normalizedComment = commentText.trim() || undefined;

      setBookmarks((prev) =>
        prev.map((b) => (b.id === bookmarkId ? { ...b, comment: normalizedComment } : b))
      );

      try {
        await api.put("/bookmarks/comment", {
          bookmarkId,
          commentText: normalizedComment || null, // API expects null for empty
        });
      } catch (error) {
        console.error("Failed to update comment:", error);
        setBookmarks(originalBookmarks);
      }
    },
    [api, bookmarks]
  );

  const updateBookmarkTags = useCallback(
    async (bookmarkId: string, newTags: string[]) => {
      const originalBookmarks = bookmarks;
      const cleanedTags = Array.from(
        new Set(newTags.map((t) => t.toLowerCase().trim()).filter(Boolean))
      ).sort();

      setBookmarks((prev) =>
        prev.map((b) => (b.id === bookmarkId ? { ...b, tags: cleanedTags } : b))
      );

      try {
        await api.put("/bookmarks/tags", {
          bookmarkId,
          newTags: cleanedTags,
        });
        await fetchAllData();
      } catch (error) {
        console.error("Failed to update tags:", error);
        setBookmarks(originalBookmarks);
      }
    },
    [api, bookmarks, fetchAllData]
  );

  const renameTagGlobally = useCallback(
    async (oldTag: string, newTag: string) => {
      setIsTagRenameLoading(true);
      const o = oldTag.toLowerCase().trim();
      const n = newTag.toLowerCase().trim();
      if (!o || !n || o === n) return;

      const tagToRename = allApiTags.find(
        (t) => t.name.toLowerCase().trim() === o
      );
      if (!tagToRename) return;

      const originalBookmarks = bookmarks;
      setBookmarks((prev) =>
        prev.map((bm) => ({
          ...bm,
          tags: (bm.tags || []).map((t) =>
            t.toLowerCase().trim() === o ? n : t
          ),
        }))
      );

      try {
        await api.put("/bookmarks/tags/rename", {
          tagId: tagToRename.id,
          newTag: n,
        });
        await fetchAllData();
      } catch (error) {
        console.error("Failed to rename tag:", error);
        setBookmarks(originalBookmarks);
      }

      setIsTagRenameLoading(false);
    },
    [api, allApiTags, bookmarks, fetchAllData]
  );

  const deleteTagGlobally = useCallback(
    async (tagToDelete: string) => {
      setIsTagDeleteLoading(true);

      const t = tagToDelete.toLowerCase().trim();
      if (!t) return;
      const tagApiInfo = allApiTags.find(
        (tag) => tag.name.toLowerCase().trim() === t
      );
      if (!tagApiInfo) return;
      const originalBookmarks = bookmarks;
      setBookmarks((prev) =>
        prev.map((bm) => ({
          ...bm,
          tags: (bm.tags || []).filter((tag) => tag.toLowerCase().trim() !== t),
        }))
      );

      try {
        await api.delete("/bookmarks/tags/delete", {
          data: { tagId: tagApiInfo.id },
        });
        await fetchAllData();
      } catch (error) {
        console.error("Failed to delete tag:", error);
        setBookmarks(originalBookmarks);
      }

      setIsTagDeleteLoading(true);

    },
    [api, allApiTags, bookmarks, fetchAllData]
  );

  const showPopup = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActivePopup({ bookmarkId, rect });
    setActiveCommentModal(null);
    setActiveTagModal(null);
  }, []);

  const hidePopup = useCallback(() => {
    if (activePopup) {
      const bookmark = getBookmarkById(activePopup.bookmarkId);
      if (bookmark && !bookmark.isConfirmed) {
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
      }
    }
    setActivePopup(null);
  }, [activePopup, getBookmarkById]);

  const showCommentModal = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActiveCommentModal({ bookmarkId, rect });
    setActivePopup(null);
    setActiveTagModal(null);
  }, []);

  const hideCommentModal = useCallback(() => setActiveCommentModal(null), []);

  const showTagModal = useCallback((bookmarkId: string, rect: DOMRect) => {
    setActiveTagModal({ bookmarkId, rect });
    setActivePopup(null);
    setActiveCommentModal(null);
  }, []);

  const hideTagModal = useCallback(() => setActiveTagModal(null), []);

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        isLoading,
        addBookmark,
        removeBookmark,
        confirmBookmark,
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
        isTagRenameLoading,
        isTagDeleteLoading,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = (): BookmarkContextType => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error("useBookmarks must be used within a BookmarkProvider");
  }
  return context;
};