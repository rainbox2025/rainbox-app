"use client";
import { useState } from "react";
import {
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Folder, Sender } from "@/types/data";

interface DragDropProps {
  folders: Folder[];
  senders: Sender[];
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setFocusedFolder: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useDragDropHandlers({
  folders,
  senders,
  expandedFolders,
  setExpandedFolders,
  setFocusedFolder
}: DragDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSender, setActiveSender] = useState<Sender | null>(null);
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);

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

    if (active.id.toString().startsWith("sender-")) {
      const senderId = active.id.toString().replace("sender-", "");
      const sender = senders.find((s) => s.id === senderId);
      if (sender) {
        setActiveSender(sender);
      }
    } else if (active.id.toString().startsWith("folder-")) {
      const folderId = active.id.toString().replace("folder-", "");
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        setActiveFolder(folder);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      clearDragState();
      return;
    }

    // Moving a sender
    if (active.id.toString().startsWith("sender-") && over) {
      const senderId = active.id.toString().replace("sender-", "");
      const sender = senders.find((s) => s.id === senderId);

      if (!sender) {
        clearDragState();
        return;
      }

      let targetFolderId = "";

      // If dropped over a folder
      if (over.id.toString().startsWith("folder-")) {
        targetFolderId = over.id.toString().replace("folder-", "");

        // This is where you would call an API to update the sender's folder
        // e.g. updateSenderFolder(senderId, targetFolderId);

        console.log(`Moved ${sender.name} to folder: ${targetFolderId}`);

        // Expand the target folder
        if (!expandedFolders[targetFolderId]) {
          setExpandedFolders((prev) => ({
            ...prev,
            [targetFolderId]: true,
          }));
        }

        // Focus the folder
        setFocusedFolder(targetFolderId);
      }
      // If dropped over another sender
      else if (over.id.toString().startsWith("sender-")) {
        const overSenderId = over.id.toString().replace("sender-", "");
        const overSender = senders.find((s) => s.id === overSenderId);

        if (overSender) {
          targetFolderId = overSender.category || "";

          // This is where you would call an API to update the sender's folder and order
          // e.g. updateSenderFolderAndOrder(senderId, targetFolderId, newIndex);

          console.log(`Moved ${sender.name} to folder: ${targetFolderId} via another sender`);

          // Expand the target folder if needed
          if (targetFolderId && !expandedFolders[targetFolderId]) {
            setExpandedFolders((prev) => ({
              ...prev,
              [targetFolderId]: true,
            }));
            setFocusedFolder(targetFolderId);
          }
        }
      }
      // If dropped over root area
      else if (over.id === "root-items") {
        // This is where you would call an API to remove sender from any folder
        // e.g. removeSenderFromFolder(senderId);

        console.log(`Moved ${sender.name} to root`);
        setFocusedFolder(null);
      }
    }
    // Moving a folder (reordering)
    else if (
      active.id.toString().startsWith("folder-") &&
      over.id.toString().startsWith("folder-")
    ) {
      const folderId = active.id.toString().replace("folder-", "");
      const overFolderId = over.id.toString().replace("folder-", "");

      // This is where you would call an API to reorder folders
      // e.g. reorderFolders(folderId, overFolderId);

      console.log(`Reordered folder ${folderId} relative to ${overFolderId}`);
    }

    clearDragState();
  };

  const clearDragState = () => {
    // Clear drag state after a short delay to allow animations to complete
    setTimeout(() => {
      setActiveId(null);
      setActiveSender(null);
      setActiveFolder(null);
    }, 50);
  };

  return {
    activeId,
    activeSender,
    activeFolder,
    sensors,
    handleDragStart,
    handleDragEnd
  };
}