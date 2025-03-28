import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderPlusIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Feed, Category, Folder, Sender } from "@/types/data";
import { initialCategories, initialFeeds } from "@/mock/data";
import { FeedIcon } from "./FeedIcon";
import SortableCategory from "./SortableCategory";
import SortableFeed from "./SortableFeed";
import { FeedModal } from "./FeedModal";
import { ConfirmModal } from "./ConfirmationModal";
import { FolderModal } from "./FolderModal";
import { useFolders } from "@/context/foldersContext";
import { useSenders } from "@/context/sendersContext";

export default function Inbox() {
  const { folders, isFoldersLoading } = useFolders();
  const { senders, isSendersLoading } = useSenders();
  const [categories, setCategories] = useState<Folder[]>(
    isFoldersLoading ? [] : folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      count: folder.count || 0,
      isExpanded: false
    }))
  );
  const [feeds, setFeeds] = useState<Sender[]>(senders);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >(
    folders.reduce(
      (acc, category) => ({
        ...acc,
        [category.id]: category.isExpanded,
      }),
      {}
    )
  );
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFeed, setActiveFeed] = useState<Feed | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [focusedCategory, setFocusedCategory] = useState<string | null>(
    "marketing"
  ); // Default focus on Marketing
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [currentAction, setCurrentAction] = useState<
    "delete" | "unfollow" | null
  >(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
    setFocusedCategory(categoryId);
  };

  const handleCreateFolder = (folderName: string) => {
    const newFolder: Category = {
      id: folderName.toLowerCase().replace(/\s+/g, "-"),
      name: folderName,
      count: 0,
      isExpanded: true,
    };

    setCategories((prev) => [newFolder, ...prev]);
    setExpandedCategories((prev) => ({
      ...prev,
      [newFolder.id]: true,
    }));
    setFocusedCategory(newFolder.id);
    setIsFolderModalOpen(false);
  };

  const openFolderCreationModal = () => {
    setIsFolderModalOpen(true);
  };

  const handleRenameCategory = (categoryId: string, newName: string) => {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId ? { ...category, name: newName } : category
      )
    );
  };

  const handleDeleteCategory = () => {
    if (targetId) {
      // Remove the category
      setCategories((prev) =>
        prev.filter((category) => category.id !== targetId)
      );

      // Remove all feeds in that category or move them to root
      setFeeds((prev) =>
        prev.map((feed) =>
          feed.category === targetId ? { ...feed, category: "" } : feed
        )
      );

      // Clean up expanded state
      setExpandedCategories((prev) => {
        const newState = { ...prev };
        delete newState[targetId];
        return newState;
      });

      // Reset focus if needed
      if (focusedCategory === targetId) {
        setFocusedCategory(null);
      }
    }
  };

  const handleUnfollowFeed = () => {
    if (targetId) {
      // Remove the feed or mark as unfollowed
      setFeeds((prev) => prev.filter((feed) => feed.id !== targetId));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSaveFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: Category = {
        id: newFolderName.toLowerCase().replace(/\s+/g, "-"),
        name: newFolderName,
        count: 0,
        isExpanded: true,
      };

      setCategories((prev) => [newFolder, ...prev]);
      setExpandedCategories((prev) => ({
        ...prev,
        [newFolder.id]: true,
      }));
      setFocusedCategory(newFolder.id);

      console.log(`Created new folder: ${newFolderName}`);
    }

    setIsCreatingFolder(false);
    setNewFolderName("");
  };

  // Update category counts when feeds are moved
  const updateCategoryCounts = (updatedFeeds: Feed[]) => {
    const newCategories = [...categories];

    // Reset all counts first
    newCategories.forEach((category) => {
      category.count = 0;
    });

    // Calculate new counts based on feeds
    updatedFeeds.forEach((feed) => {
      if (feed.category) {
        const categoryIndex = newCategories.findIndex(
          (c) => c.id === feed.category
        );
        if (categoryIndex !== -1) {
          newCategories[categoryIndex].count += feed.count;
        }
      }
    });

    setCategories(newCategories);
  };

  // Update counts whenever feeds change
  // Update useEffect to update categories when folders load
  useEffect(() => {
    if (!isFoldersLoading) {
      setCategories(
        folders.map(folder => ({
          id: folder.id,
          name: folder.name,
          count: folder.count || 0,
          isExpanded: false
        }))
      );
    }
  }, [folders, isFoldersLoading]);

  if (isFoldersLoading) {
    return (
      <div className="flex-1 bg-background text-foreground rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <div key={index} className="mb-3">
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    if (active.id.toString().startsWith("feed-")) {
      const feedId = active.id.toString().replace("feed-", "");
      const feed = feeds.find((f) => f.id === feedId);
      if (feed) {
        setActiveFeed(feed);
      }
    } else if (active.id.toString().startsWith("category-")) {
      const categoryId = active.id.toString().replace("category-", "");
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        setActiveCategory(category);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveFeed(null);
      setActiveCategory(null);
      return;
    }

    // Moving a feed
    if (active.id.toString().startsWith("feed-") && over) {
      const feedId = active.id.toString().replace("feed-", "");
      const feed = feeds.find((f) => f.id === feedId);

      if (!feed) return;

      let targetCategory = "";

      // If dropped over a category
      if (over.id.toString().startsWith("category-")) {
        targetCategory = over.id.toString().replace("category-", "");

        // Update the feed's category
        const updatedFeeds = feeds.map((f) =>
          f.id === feedId ? { ...f, category: targetCategory } : f
        );

        setFeeds(updatedFeeds);

        // Force re-render of the target category
        if (!expandedCategories[targetCategory]) {
          setExpandedCategories((prev) => ({
            ...prev,
            [targetCategory]: true,
          }));
        } else {
          // Force re-render if already expanded
          const newExpandedState = { ...expandedCategories };
          setExpandedCategories(newExpandedState);
        }

        // Focus the category
        setFocusedCategory(targetCategory);

        console.log(
          `Moved ${feed.name} from ${feed.category || "root"} to ${targetCategory || "root"}`
        );
      }
      // If dropped over another feed
      else if (over.id.toString().startsWith("feed-")) {
        const overFeedId = over.id.toString().replace("feed-", "");
        const overFeed = feeds.find((f) => f.id === overFeedId);

        if (overFeed) {
          targetCategory = overFeed.category || "";

          // Reorder within the same category or move to another category
          const currentIndex = feeds.findIndex((f) => f.id === feedId);
          const newIndex = feeds.findIndex((f) => f.id === overFeedId);

          if (currentIndex !== -1 && newIndex !== -1) {
            const updatedFeeds = [...feeds];
            const [movedFeed] = updatedFeeds.splice(currentIndex, 1);
            movedFeed.category = targetCategory;
            updatedFeeds.splice(newIndex, 0, movedFeed);

            setFeeds(updatedFeeds);

            // Force re-render by updating state even if not changing values
            if (targetCategory) {
              const newExpandedState = { ...expandedCategories };
              if (!newExpandedState[targetCategory]) {
                newExpandedState[targetCategory] = true;
              }
              setExpandedCategories(newExpandedState);
              setFocusedCategory(targetCategory);
            } else {
              // Force re-render for root items
              setFocusedCategory((prev) => {
                // Toggle to force re-render, then back to null for root
                return prev === "force-update" ? null : "force-update";
              });
            }

            console.log(
              `Moved ${feed.name} from ${feed.category || "root"} to ${targetCategory || "root"} and reordered`
            );
          }
        }
      }
      // If dropped over root
      else if (over.id === "root-items") {
        const updatedFeeds = feeds.map((f) =>
          f.id === feedId ? { ...f, category: "" } : f
        );

        setFeeds(updatedFeeds);

        // Force re-render of root items
        setFocusedCategory((prev) => {
          // Toggle to force re-render, then back to null for root
          return prev === "force-update" ? null : "force-update";
        });

        console.log(
          `Moved ${feed.name} from ${feed.category || "root"} to root`
        );
      }
    }

    // Moving a category (folder)
    else if (
      active.id.toString().startsWith("category-") &&
      over.id.toString().startsWith("category-")
    ) {
      const categoryId = active.id.toString().replace("category-", "");
      const overCategoryId = over.id.toString().replace("category-", "");

      const activeIndex = categories.findIndex((c) => c.id === categoryId);
      const overIndex = categories.findIndex((c) => c.id === overCategoryId);

      if (activeIndex !== -1 && overIndex !== -1) {
        const updatedCategories = [...categories];
        const [movedCategory] = updatedCategories.splice(activeIndex, 1);
        updatedCategories.splice(overIndex, 0, movedCategory);

        setCategories(updatedCategories);

        // Force re-render after category reordering
        const newExpandedState = { ...expandedCategories };
        setExpandedCategories(newExpandedState);

        console.log(`Reordered folder: ${movedCategory.name}`);
      }
    }

    // Clear drag state after a short delay to allow animations to complete
    setTimeout(() => {
      setActiveId(null);
      setActiveFeed(null);
      setActiveCategory(null);
    }, 50);
  };

  // Get root items (not in any category)
  const rootFeeds = feeds.filter((feed) => feed.category === "");

  // Get feeds for a specific category
  const getFeedsForCategory = (categoryId: string) => {
    return feeds.filter((feed) => feed.category === categoryId);
  };

  const categoryIds = categories.map((category) => `category-${category.id}`);
  const rootFeedIds = rootFeeds.map((feed) => `feed-${feed.id}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 bg-background text-foreground rounded-lg">
        <div className="px-4 w-[99%] p-xs pr-2 flex items-center justify-between sticky top-0 bg-background z-10">
          <h3 className="font-medium text-sm text-muted-foreground">Inbox</h3>
          <button
            className="p-xs text-muted-foreground hover:cursor-pointer hover:text-foreground rounded-full hover:bg-accent transition-colors"
            onClick={openFolderCreationModal}
          >
            <FolderPlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-md py-sm flex items-center justify-between bg-background hover:bg-accent rounded-md cursor-pointer">
          <div className="flex items-center space-x-md">
            <FolderIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">All</span>
          </div>
          <span className="text-xs text-muted-foreground">{850}</span>
        </div>

        <div className="px-0 py-0">
          {/* New Folder Input */}
          <AnimatePresence>
            {isCreatingFolder && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="px-md py-2 mb-2 bg-blue-50 rounded-md border border-blue-200"
              >
                <div className="flex items-center space-x-md">
                  <ChevronDownIcon className="w-4 h-4 text-blue-500" />
                  <input
                    ref={newFolderInputRef}
                    type="text"
                    className="text-sm font-medium bg-transparent border-none focus:ring-0 outline-none flex-1"
                    placeholder="New Folder"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onBlur={handleSaveFolder}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveFolder()}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories */}
          <SortableContext
            items={categoryIds}
            strategy={verticalListSortingStrategy}
          >
            {categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                expanded={expandedCategories[category.id]}
                toggleExpanded={toggleCategory}
                feeds={getFeedsForCategory(category.id)}
                activeCategory={focusedCategory}
                onRenameCategory={handleRenameCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            ))}
          </SortableContext>

          {/* Root Items (not in any category) */}
          <motion.div
            id="root-items"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SortableContext
              items={rootFeedIds}
              strategy={verticalListSortingStrategy}
            >
              {rootFeeds.map((feed) => (
                <SortableFeed key={feed.id} feed={feed} />
              ))}
            </SortableContext>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-center text-xs text-muted-foreground">
          <p>Drag items to rearrange or move between folders</p>
          <p className="mt-1">All changes are automatically saved</p>
        </div>
      </div>

      {/* Folder Creation Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={handleCreateFolder}
        title="Create New Folder"
      />

      {/* Confirmation Modal (for delete/unfollow) */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setCurrentAction(null);
          setTargetId(null);
        }}
        onConfirm={() => {
          if (currentAction === "delete") handleDeleteCategory();
          if (currentAction === "unfollow") handleUnfollowFeed();
        }}
        title={currentAction === "delete" ? "Delete Folder" : "Unfollow Feed"}
        description={
          currentAction === "delete"
            ? "Are you sure you want to delete this folder? This operation cannot be undone."
            : "Are you sure you want to unfollow this feed?"
        }
        showUnfollowOption={currentAction === "delete"}
      />

      <DragOverlay>
        {activeId && activeFeed && (
          <div className="px-md py-1.5 flex items-center justify-between rounded-md bg-secondary dark:bg-secondary text-foreground shadow-md">
            <div className="flex items-center space-x-3">
              <FeedIcon feed={activeFeed} />
              <span className="text-sm">{activeFeed.name}</span>
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {activeFeed.count >= 1000
                ? `${Math.floor(activeFeed.count / 1000)}K+`
                : activeFeed.count}
            </span>
          </div>
        )}

        {activeId && activeCategory && (
          <div className="px-md py-2 flex items-center justify-between rounded-md bg-secondary dark:bg-secondary text-foreground shadow-md">
            <div className="flex items-center space-x-3">
              <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{activeCategory.name}</span>
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {activeCategory.count}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
