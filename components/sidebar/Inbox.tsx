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
import { FeedIcon } from "./FeedIcon";
import SortableCategory from "./SortableCategory";
import SortableFeed from "./SortableFeed";
import { FeedModal } from "./FeedModal";
import { ConfirmModal } from "./ConfirmationModal";
import { FolderModal } from "./FolderModal";
import { useFolders } from "@/context/foldersContext";
import { useSenders } from "@/context/sendersContext";

export default function Inbox() {
  const { folders, isFoldersLoading, createFolder, deleteFolder } = useFolders();
  const { senders, isSendersLoading } = useSenders();
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFeed, setActiveFeed] = useState<Feed | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [focusedCategory, setFocusedCategory] = useState<string | null>(
    "marketing"
  ); // Default focus on Marketing

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
  const [currentAction, setCurrentAction] = useState<
    "delete" | "unfollow" | null
  >(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  // Initialize expanded categories state when folders load
  useEffect(() => {
    if (!isFoldersLoading && folders.length > 0) {
      setExpandedCategories(
        folders.reduce(
          (acc, folder) => ({
            ...acc,
            [folder.id]: folder.isExpanded || false,
          }),
          {}
        )
      );
    }
  }, [folders, isFoldersLoading]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
    setFocusedCategory(categoryId);
  };

  const openFolderCreationModal = () => {
    setIsFolderModalOpen(true);
  };

  const handleRenameCategory = (categoryId: string, newName: string) => {
    // This would need to be implemented in the folder context
    console.log(`Rename category ${categoryId} to ${newName}`);
  };

  const handleDeleteCategory = () => {
    if (targetId) {
      deleteFolder(targetId);

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

      setIsConfirmModalOpen(false);
      setCurrentAction(null);
      setTargetId(null);
    }
  };

  const handleUnfollowFeed = () => {
    console.log(`Unfollowing feed with ID: ${targetId}`);
    setIsConfirmModalOpen(false);
    setCurrentAction(null);
    setTargetId(null);
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    if (active.id.toString().startsWith("feed-")) {
      const feedId = active.id.toString().replace("feed-", "");
      const feed = senders.find((f) => f.id === feedId);
      if (feed) {
        setActiveFeed(feed);
      }
    } else if (active.id.toString().startsWith("category-")) {
      const categoryId = active.id.toString().replace("category-", "");
      const category = folders.find((c) => c.id === categoryId);
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
      const feed = senders.find((f) => f.id === feedId);

      if (!feed) return;

      let targetCategory = "";

      // If dropped over a category
      if (over.id.toString().startsWith("category-")) {
        targetCategory = over.id.toString().replace("category-", "");

        // Update the feed's category would be handled by the context
        console.log(
          `Moved ${feed.name} from ${feed.category || "root"} to ${targetCategory || "root"}`
        );

        // Force re-render of the target category
        if (!expandedCategories[targetCategory]) {
          setExpandedCategories((prev) => ({
            ...prev,
            [targetCategory]: true,
          }));
        }

        // Focus the category
        setFocusedCategory(targetCategory);
      }
      // If dropped over another feed or root items
      else {
        console.log(`Reordering feed or moving to root area`);
      }
    }
    // Moving a category (folder)
    else if (
      active.id.toString().startsWith("category-") &&
      over.id.toString().startsWith("category-")
    ) {
      // Folder reordering would be handled by context
      console.log(`Reordering folders`);
    }

    // Clear drag state
    setTimeout(() => {
      setActiveId(null);
      setActiveFeed(null);
      setActiveCategory(null);
    }, 50);
  };

  // Get root items (not in any category)
  const rootFeeds = senders.filter((feed) => !feed.category || feed.category === "");

  // Get feeds for a specific category
  const getFeedsForCategory = (categoryId: string) => {
    return senders.filter((feed) => feed.category === categoryId);
  };

  // Calculate total count for display
  const totalCount = senders.reduce((total, sender) => total + (sender.count || 0), 0);

  if (isFoldersLoading || isSendersLoading) {
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

  const categoryIds = folders.map((category) => `category-${category.id}`);
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
          <span className="text-xs text-muted-foreground">{totalCount}</span>
        </div>

        <div className="px-0 py-0">
          {/* Categories */}
          <SortableContext
            items={categoryIds}
            strategy={verticalListSortingStrategy}
          >
            {folders.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                expanded={expandedCategories[category.id] || false}
                toggleExpanded={toggleCategory}
                feeds={getFeedsForCategory(category.id)}
                activeCategory={focusedCategory}
                onRenameCategory={handleRenameCategory}
                onDeleteCategory={(categoryId) => {
                  setTargetId(categoryId);
                  setCurrentAction("delete");
                  setIsConfirmModalOpen(true);
                }}
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
                <SortableFeed
                  key={feed.id}
                  feed={feed}
                // onUnfollow={(feedId) => {
                //   setTargetId(feedId);
                //   setCurrentAction("unfollow");
                //   setIsConfirmModalOpen(true);
                // }}
                />
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
        onSave={(folderName) => { createFolder(folderName); setIsFolderModalOpen(false) }}
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