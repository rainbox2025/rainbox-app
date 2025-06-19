import React, { useState, useEffect, useMemo } from "react";
import { FolderIcon, FolderPlusIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/ui/skeleton";
import FolderComponent from "./Folder";
import SortableSender from "./Sender";
import Sender from "./Sender";
import { BasicModal } from "../modals/basic-modal";
import { useFolders } from "@/context/foldersContext";
import { useSenders } from "@/context/sendersContext";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FolderType, SenderType } from "@/types/data";
import { isEqual } from 'lodash';

type SidebarItem =
  | { type: 'folder', id: string; data: FolderType }
  | { type: 'sender', id: string; data: SenderType };


type SidebarOrderType = {
  root: string[];
  [key: string]: string[];
};

export default function Inbox() {
  const {
    folders,
    setFolders,
    isFoldersLoading,
    createFolder,
    sidebarOrder,
    isSidebarOrderLoading,
    saveSidebarOrder,
    setSidebarOrder,
    addSenderToFolder,
    moveSenderToRoot
  } = useFolders();
  const { senders, setSenders, isSendersLoading } = useSenders();

  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  const [activeItem, setActiveItem] = useState<SidebarItem | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [focusedFolder, setFocusedFolder] = useState<string | null>(null);

  const openFolderCreationModal = () => setIsFolderModalOpen(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const itemsById = useMemo(() => {
    const map = new Map<string, SidebarItem>();
    sidebarItems.forEach(item => map.set(item.id, item));
    folders.forEach(folder => {
      (folder.senders || []).forEach(sender => {
        map.set(`sender-${sender.id}`, { type: 'sender', id: `sender-${sender.id}`, data: sender });
      });
    });
    return map;
  }, [sidebarItems, folders]);

  useEffect(() => {
    if (isFoldersLoading || isSendersLoading || isSidebarOrderLoading) return;

    const rootSenders = senders.filter(sender => !sender.folder_id);

    const initialSidebarItems: SidebarItem[] = [
      ...folders.map(f => ({ type: 'folder' as const, id: `folder-${f.id}`, data: f })),
      ...rootSenders.map(s => ({ type: 'sender' as const, id: `sender-${s.id}`, data: s }))
    ];

    if (sidebarOrder) {
      try {
        const itemMap = new Map(initialSidebarItems.map(item => [item.id, item]));
        const orderedSidebarItems: SidebarItem[] = [];

        if (sidebarOrder.root) {
          sidebarOrder.root.forEach((id: string) => {
            if (itemMap.has(id)) {
              orderedSidebarItems.push(itemMap.get(id)!);
              itemMap.delete(id);
            }
          });
        }
        orderedSidebarItems.push(...Array.from(itemMap.values()));

        const orderedFolders = folders.map(folder => {
          const folderOrder = sidebarOrder[folder.id];
          if (folderOrder && folder.senders) {
            const senderMap = new Map(folder.senders.map(s => [s.id, s]));
            const orderedSenders: SenderType[] = [];
            folderOrder.forEach((senderId: string) => {
              if (senderMap.has(senderId)) {
                orderedSenders.push(senderMap.get(senderId)!);
                senderMap.delete(senderId);
              }
            });
            orderedSenders.push(...Array.from(senderMap.values()));
            return { ...folder, senders: orderedSenders };
          }
          return folder;
        });

        if (!isEqual(sidebarItems, orderedSidebarItems)) {
          setSidebarItems(orderedSidebarItems);
        }
        if (!isEqual(folders, orderedFolders)) {
          setFolders(orderedFolders);
        }
      } catch (e) {
        console.error("Failed to apply sidebar order", e);
        setSidebarItems(initialSidebarItems);
      }
    } else {
      setSidebarItems(initialSidebarItems);
    }
  }, [folders, senders, sidebarOrder, isFoldersLoading, isSendersLoading, isSidebarOrderLoading, setFolders]);

  const saveOrderToBackend = (currentFolders: FolderType[], currentSidebarItems: SidebarItem[]) => {
    const orderToSave: { [key: string]: any } = {
      root: currentSidebarItems.map(item => item.id)
    };
    currentFolders.forEach(folder => {
      if (folder.senders && folder.senders.length > 0) {
        orderToSave[folder.id] = folder.senders.map(s => s.id);
      }
    });
    saveSidebarOrder(orderToSave);
  };

  useEffect(() => {
    if (!isFoldersLoading) {
      // Use the functional update form of setState to safely access the previous state.
      setExpandedFolders(prevExpanded => {
        const newExpandedState = { ...prevExpanded };
        const currentFolderIds = new Set(folders.map(f => f.id));

        // 1. Add any new folders that aren't in our state yet, preserving their default
        folders.forEach(folder => {
          if (newExpandedState[folder.id] === undefined) {
            newExpandedState[folder.id] = folder.isExpanded || false;
          }
        });

        // 2. (Optional but good practice) Remove any folders from our state that no longer exist
        Object.keys(newExpandedState).forEach(folderId => {
          if (!currentFolderIds.has(folderId)) {
            delete newExpandedState[folderId];
          }
        });

        // 3. Only return a new object if the state has actually changed.
        // The `isEqual` function is already imported in your file.
        return isEqual(prevExpanded, newExpandedState) ? prevExpanded : newExpandedState;
      });
    }
  }, [folders, isFoldersLoading]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
    setFocusedFolder(folderId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = itemsById.get(active.id as string);
    if (item) setActiveItem(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeItem = itemsById.get(activeId);
    if (!activeItem) return;

    if (activeItem.type === 'folder') {
      const oldIndex = sidebarItems.findIndex(item => item.id === activeId);
      const newIndex = sidebarItems.findIndex(item => item.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSidebarOrder = arrayMove(sidebarItems, oldIndex, newIndex);
        setSidebarItems(newSidebarOrder);
        // Note: We need to update the `sidebarOrder` state here too for consistency.
        const orderToSave: SidebarOrderType = { // <--- Apply the type here
          root: newSidebarOrder.map(item => item.id)
        };
        folders.forEach(folder => {
          if (folder.senders && folder.senders.length > 0) {
            // Use sidebarOrder to get the existing folder order if available
            const existingOrder = sidebarOrder?.[folder.id] || folder.senders.map(s => s.id);
            orderToSave[folder.id] = existingOrder;
          }
        });
        setSidebarOrder(orderToSave);
        saveSidebarOrder(orderToSave);
      }
      return;
    }

    if (activeItem.type === 'sender') {
      const sender = activeItem.data;
      const sourceFolderId = sender.folder_id;
      const overData = over.data.current;

      const activeContainer = active.data.current?.sortable.containerId;
      const overContainer = overData?.sortable?.containerId ?? (overData?.type === 'folder' ? `folder-${overData.folder.id}` : 'root');

      if (activeContainer === overContainer) {
        let newSidebarItems = sidebarItems;
        let newFolders = folders;

        if (activeContainer === 'root') {
          const oldIndex = sidebarItems.findIndex(item => item.id === active.id);
          const newIndex = sidebarItems.findIndex(item => item.id === over.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            newSidebarItems = arrayMove(sidebarItems, oldIndex, newIndex);
            setSidebarItems(newSidebarItems);
          }
        } else {
          const folderId = activeContainer.replace('folder-', '');
          newFolders = folders.map(f => {
            if (f.id === folderId && f.senders) {
              const oldIndex = f.senders.findIndex(s => `sender-${s.id}` === active.id);
              const newIndex = f.senders.findIndex(s => `sender-${s.id}` === over.id);
              if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedSenders = arrayMove(f.senders, oldIndex, newIndex);
                return { ...f, senders: reorderedSenders };
              }
            }
            return f;
          });
          setFolders(newFolders);
        }

        const orderToSave: SidebarOrderType = { // <--- Apply the type here
          root: newSidebarItems.map(item => item.id)
        };
        newFolders.forEach(folder => {
          if (folder.senders && folder.senders.length > 0) {
            orderToSave[folder.id] = folder.senders.map(s => s.id);
          }
        });

        setSidebarOrder(orderToSave);
        saveSidebarOrder(orderToSave);

      } else {
        let newFolders = [...folders];
        let newSidebar = [...sidebarItems];
        let movedSender = { ...sender };

        if (sourceFolderId) {
          newFolders = newFolders.map(f =>
            f.id === sourceFolderId
              ? { ...f, senders: f.senders?.filter(s => s.id !== sender.id) ?? [] }
              : f
          );
        } else {
          newSidebar = newSidebar.filter(item => item.id !== active.id);
        }

        const isDroppingOnFolder = overData?.type === 'folder' || overContainer.startsWith('folder-');
        if (isDroppingOnFolder) {
          const targetFolderId = overContainer.replace('folder-', '');
          movedSender.folder_id = targetFolderId;
          const overSenderId = over.id.toString();

          newFolders = newFolders.map(f => {
            if (f.id === targetFolderId) {
              const existingSenders = f.senders ? [...f.senders] : [];
              const overIndex = existingSenders.findIndex(s => `sender-${s.id}` === overSenderId);
              existingSenders.splice(overIndex >= 0 ? overIndex : existingSenders.length, 0, movedSender);
              return { ...f, senders: existingSenders };
            }
            return f;
          });
          addSenderToFolder(sender.id, targetFolderId);
        } else {
          movedSender.folder_id = undefined;
          const overIndex = newSidebar.findIndex(item => item.id === over.id);
          newSidebar.splice(overIndex >= 0 ? overIndex : newSidebar.length, 0, { type: 'sender', id: active.id as string, data: movedSender });
          moveSenderToRoot(sender.id);
        }

        const newSenders = senders.map(s => s.id === movedSender.id ? movedSender : s);

        setSenders(newSenders);
        setFolders(newFolders);
        setSidebarItems(newSidebar);

        const newOrder: SidebarOrderType = { // <--- Apply the type here
          root: newSidebar.map(item => item.id)
        };
        newFolders.forEach(folder => {
          if (folder.senders && folder.senders.length > 0) {
            newOrder[folder.id] = folder.senders.map(s => s.id);
          }
        });

        setSidebarOrder(newOrder);
        saveSidebarOrder(newOrder);
      }
    }
  };


  const totalCount = senders.reduce((total, sender) => total + (sender.count || 0), 0)
    + folders.reduce((total, folder) => total + (folder.count || 0), 0);

  const rootItemIds = useMemo(() => sidebarItems.map(item => item.id), [sidebarItems]);

  const isLoading = isFoldersLoading || isSendersLoading || isSidebarOrderLoading;

  if (isLoading) {
    return (
      <div className="flex-1 text-foreground rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="mb-3">
            <Skeleton className="h-6 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 text-foreground rounded-lg">
        <div className="px-4 w-[99%] p-xs pr-2 flex items-center justify-between sticky top-0 z-10 bg-sidebar">
          <h3 className="font-medium text-sm text-muted-foreground">Inbox</h3>
          <button
            className="p-xs text-muted-foreground hover:cursor-pointer hover:text-foreground rounded-full hover:bg-accent"
            onClick={openFolderCreationModal}
            title="Create a new folder"
          >
            <FolderPlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-md py-sm flex items-center justify-between hover:bg-accent rounded-md cursor-pointer">
          <div className="flex items-center space-x-md">
            <FolderIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">All</span>
          </div>
          <span className="text-xs text-muted-foreground">{totalCount}</span>
        </div>

        <div className="px-0 py-0 space-y-1">
          <SortableContext items={rootItemIds} strategy={verticalListSortingStrategy} id="root">
            {sidebarItems.map(item => {
              if (item.type === 'folder') {
                return <FolderComponent
                  key={item.id}
                  folder={item.data}
                  expanded={expandedFolders[item.data.id] || false}
                  toggleExpanded={toggleFolder}
                  activeFolder={focusedFolder}
                  activeItem={activeItem}
                />
              }
              if (item.type === 'sender') {
                return <SortableSender key={item.id} sender={item.data} />
              }
              return null;
            })}
          </SortableContext>
        </div>

        <div className="px-4 py-3 text-center text-xs text-muted-foreground/30">
          <p>New subscriptions will automatically appear here</p>
          <p className="mt-1">Hold and drag to rearrange feeds</p>
        </div>

        <div className="px-4 py-3 mt-auto border-border absolute bottom-2">
          <div className="bg-content p-3 rounded-lg shadow-sm">
            <p className="text-sm text-foreground">
              30 days left in your free trial. Keep your reading habit alive.
              <span className="ml-1 text-blue-500 font-semibold cursor-pointer">
                Upgrade now
              </span>
            </p>
          </div>
        </div>
        <BasicModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          onSave={(folderName) => {
            createFolder(folderName);
            setIsFolderModalOpen(false);
          }}
          title="Create New Folder"
        />
      </div>
      <DragOverlay>
        {activeItem ? (
          <div style={{ opacity: 0.8 }}>
            {activeItem.type === 'folder' && <FolderComponent folder={activeItem.data} expanded={false} toggleExpanded={() => { }} activeFolder={null} activeItem={null} />}
            {activeItem.type === 'sender' && <Sender sender={activeItem.data} />}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}