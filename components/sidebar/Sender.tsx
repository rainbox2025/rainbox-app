import { SenderType } from "@/types/data";
import { useState } from "react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { DeleteConfirmationModal } from "../modals/delete-modal";
import { useSenders } from "@/context/sendersContext";
import { EditSenderModal } from "../modals/edit-sender-modal";
import { SenderDropdownMenu } from "./sender-dropdown-menu";
import { SenderIcon } from "./sender-icon";

interface SenderProps {
  sender: SenderType;
}

export default function Sender({ sender }: SenderProps) {
  const { renameSender, unsubcribeSender, toggleReadSender, setSelectedSender } = useSenders();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isMarkAsReadModalOpen, setIsMarkAsReadModalOpen] = useState(false);
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsRenaming(true);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsMarkAsReadModalOpen(true);
  };

  const handleMoveToFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    // You can implement folder moving logic here, perhaps opening a modal
    console.log('move to folder');
  };

  const handleMuteNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    console.log(`Muted notifications for ${sender.name}`);
  };

  const handleUnfollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsUnfollowModalOpen(true);
  };

  return (
    <>
      <div
        className="group p-xs px-md flex items-center justify-between rounded-md hover:bg-accent"
      >
        <div
          className="flex items-center space-x-md overflow-hidden flex-1 cursor-pointer"
          onClick={() => {
            setSelectedSender(sender);
            console.log(sender);
          }}
        >
          <SenderIcon sender={sender} />
          <span className="text-sm font-medium truncate overflow-hidden mr-2">
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
              onRename={handleRename}
              onMoveToFolder={handleMoveToFolder}
              onMuteNotifications={handleMuteNotifications}
              onUnfollow={handleUnfollow}
            />
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            {sender.count >= 1000
              ? `${Math.floor(sender.count / 1000)}K+`
              : sender.count}
          </span>
        </div>
      </div>

      {/* Modals for actions */}
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
      <EditSenderModal
        isOpen={isRenaming}
        onClose={() => setIsRenaming(false)}
        onSave={(newName: string) => {
          renameSender(sender.id, newName);
          setIsRenaming(false);
        }}
        initialValues={{
          source: sender.domain || "",
          title: sender.name,
          folder: "No Folder" // This might need logic to find the current folder name
        }}
      />
    </>
  );
}