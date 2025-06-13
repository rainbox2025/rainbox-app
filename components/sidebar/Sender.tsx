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

interface SenderProps {
  sender: SenderType;
}

const Sender = forwardRef<HTMLDivElement, SenderProps>(({ sender }, ref) => {
  const { unsubcribeSender, toggleReadSender, setSelectedSender, selectedSender } = useSenders();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMarkAsReadModalOpen, setIsMarkAsReadModalOpen] = useState(false);
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);

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

  const handleMoveToFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
  };

  const handleMuteNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
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
          onClick={() => setSelectedSender(sender)}
        >
          <div className=" flex-shrink-0">
            <SenderIcon sender={sender} />
          </div>
          <span className="text-sm font-medium truncate">
            {sender.name}
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
              sender={sender}
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              onMarkAsRead={handleMarkAsRead}
              onRename={handleEdit}
              onMoveToFolder={handleMoveToFolder}
              onMuteNotifications={handleMuteNotifications}
              onUnfollow={handleUnfollow}
            />
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            {sender.count >= 1000 ? `${Math.floor(sender.count / 1000)}K+` : sender.count}
          </span>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isUnfollowModalOpen}
        onClose={() => setIsUnfollowModalOpen(false)}
        onConfirm={() => {
          unsubcribeSender(sender.id);
          setIsUnfollowModalOpen(false);
        }}
        itemName={sender.name}
        itemType="sender"
      />
      <DeleteConfirmationModal
        isOpen={isMarkAsReadModalOpen}
        onClose={() => setIsMarkAsReadModalOpen(false)}
        onConfirm={() => {
          toggleReadSender(sender.id, !sender.isRead);
          setIsMarkAsReadModalOpen(false);
        }}
        itemName={sender.name}
        itemType={sender.isRead ? "markasunread" : "markasread"}
      />

      {isEditing && (
        <EditSenderModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          sender={sender}
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