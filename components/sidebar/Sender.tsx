"use client";
import { SenderType } from "@/types/data";
import { useState, forwardRef } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { DeleteConfirmationModal } from "../modals/delete-modal";
import { useSenders } from "@/context/sendersContext";
import { EditSenderModal } from "../modals/edit-sender-modal";
import { SenderDropdownMenu } from "./sender-dropdown-menu";
import { SenderIcon } from "./sender-icon";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFolders } from "@/context/foldersContext";
import { useSidebar } from "@/context/sidebarContext";

interface SenderProps {
  sender: SenderType;
}

const Sender = forwardRef<HTMLDivElement, SenderProps>(({ sender }, ref) => {
  const {
    senders,
    unsubcribeSender,
    toggleReadSender,
    toggleNotificationSender,
    setSelectedSender,
    selectedSender,
    unsubscribingId,
    togglingReadId,
    togglingNotificationId,
  } = useSenders();

  const { folders, updateSenderInUI } = useFolders();
  const { closeSidebar } = useSidebar();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMarkAsReadModalOpen, setIsMarkAsReadModalOpen] = useState(false);
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);

  const liveSender =
    folders.flatMap(f => f.senders || []).find(s => s.id === sender.id) ||
    senders.find(s => s.id === sender.id) ||
    sender;

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsEditing(true);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsMarkAsReadModalOpen(true);
  };

  const handleMuteNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsMuteModalOpen(true);
  };

  const handleUnfollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsUnfollowModalOpen(true);
  };

  return (
    <>
      <div
        ref={ref}
        className={`group p-xs px-md flex items-center justify-between rounded-md hover:bg-accent ${selectedSender?.id === sender.id ? "bg-hovered hover:bg-hovered" : ""}`}
      >
        <div
          className="flex items-center space-x-md overflow-hidden flex-1 cursor-pointer"
          onClick={() => {
            setSelectedSender(liveSender);
            if (window.innerWidth < 768) {
              closeSidebar();
            }
          }}
        >
          <div className=" flex-shrink-0">
            <SenderIcon sender={liveSender} />
          </div>
          <span className="text-sm font-medium truncate">
            {liveSender.name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              onClick={handleMenuClick}
              className="p-xs text-muted-foreground hover:cursor-pointer rounded-full transition-all duration-350 ease-in-out opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground"
            >
              <EllipsisHorizontalIcon className="w-4 h-4" />
            </button>

            <SenderDropdownMenu
              sender={liveSender}
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              onMarkAsRead={handleMarkAsRead}
              onRename={handleEdit}
              onMoveToFolder={handleEdit}
              onMuteNotifications={handleMuteNotifications}
              onUnfollow={handleUnfollow}
            />
          </div>

        {liveSender.count > 0 && (
  <span className="text-xs text-muted-foreground font-medium">
    {liveSender.count >= 1000
      ? `${Math.floor(liveSender.count / 1000)}K+`
      : liveSender.count}
  </span>
)}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isUnfollowModalOpen}
        onClose={() => setIsUnfollowModalOpen(false)}
        onConfirm={async () => {
          await unsubcribeSender(liveSender.id);
        }}
        itemName={liveSender.name}
        itemType="sender"
        isLoading={unsubscribingId === liveSender.id}
      />

      <DeleteConfirmationModal
        isOpen={isMarkAsReadModalOpen}
        onClose={() => setIsMarkAsReadModalOpen(false)}
        onConfirm={async () => {
          const updatedSender = await toggleReadSender(liveSender.id);
          updateSenderInUI(liveSender, updatedSender);
        }}
        itemName={liveSender.name}
        itemType={liveSender.isRead ? "markasunread" : "markasread"}
        isLoading={togglingReadId === liveSender.id}
      />

      <DeleteConfirmationModal
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        onConfirm={async () => {
          // This assumes toggleNotificationSender is fixed to return the updated sender
          const updatedSender = await toggleNotificationSender(liveSender.id, liveSender.notification as boolean);
          updateSenderInUI(liveSender, updatedSender);
        }}
        itemName={liveSender.name}
        itemType={liveSender.notification ? "mutenotification" : "unmutenotification"}
        isLoading={togglingNotificationId === liveSender.id}
      />

      {isEditing && (
        <EditSenderModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          sender={liveSender}
        />
      )}
    </>
  );
});

Sender.displayName = 'Sender';

export default function SortableSender({ sender }: SenderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `sender-${sender.id}`, data: { type: 'sender', sender, sortable: { containerId: sender.folder_id ? `folder-${sender.folder_id}` : 'root' } } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Sender sender={sender} />
    </div>
  );
}