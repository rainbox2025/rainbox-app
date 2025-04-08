import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMails } from "@/context/mailsContext";
import { XIcon, RefreshCcw, CheckIcon, MoreHorizontal } from "lucide-react";
import { useSenders } from "@/context/sendersContext";
import { SenderDropdownMenu } from "../sidebar/SenderDropdownMenu";
import { DeleteConfirmationModal } from "../sidebar/DeleteModal";
import { EditSenderModal } from "../sidebar/EditSenderModal";

export const SenderHeader = ({
  filter,
  setFilter,
  unreadCount,
}: {
  filter: string;
  setFilter: (filter: string) => void;
  unreadCount: number;
}) => {
  // State for dropdown menu
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isMarkAsReadModalOpen, setIsMarkAsReadModalOpen] = useState(false);
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);

  const {
    refreshMails,
    markAsReadAllBySenderId,
    selectedMail,
    setSelectedMail,
  } = useMails();

  const {
    selectedSender,
    setSelectedSender,
    renameSender,
    unsubcribeSender,
    toggleReadSender
  } = useSenders();

  // Handler functions for dropdown menu actions
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsMarkAsReadModalOpen(true);
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsRenaming(true);
  };

  const handleMoveToFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    // Add your move to folder logic here
    console.log(`Move ${selectedSender?.name} to folder`);
  };

  const handleMuteNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    // Add your mute notifications logic here
    console.log(`Muted notifications for ${selectedSender?.name}`);
  };

  const handleUnfollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setIsUnfollowModalOpen(true);
  };

  // If no sender is selected, return nothing
  if (!selectedSender) return null;

  return (
    <>
      <div className="flex flex-row ml-[2px] items-center justify-between p-sm h-header border-b border-border sticky top-0 bg-content/95 backdrop-blur-sm z-10">
        <h1 className="text-lg font-semibold pl-3">{selectedSender?.name}</h1>
        <div className="flex flex-row items-center gap-1">
          <Select onValueChange={setFilter} value={filter}>
            <SelectTrigger className="h-7 w-[140px] border-none bg-muted/50 text-muted-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="text-muted-foreground" value="all">All</SelectItem>
              <SelectItem className="text-muted-foreground" value="unread">Unread ({unreadCount})</SelectItem>
              <SelectItem className="text-muted-foreground" value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          <button
            className="p-xs rounded-full hover:bg-muted transition-colors"
            onClick={() => {
              refreshMails();
            }}
          >
            <RefreshCcw className="w-4 h-4 text-muted-foreground hover:bg-accent hover:text-foreground" />
          </button>
          <button
            onClick={() => markAsReadAllBySenderId(selectedSender?.id!)}
            className="p-xs rounded-full hover:bg-muted transition-colors"
          >
            <CheckIcon className="w-4 h-4 text-muted-foreground hover:bg-accent hover:text-foreground" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-xs rounded-full hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground hover:bg-accent hover:text-foreground" />
            </button>

            <SenderDropdownMenu
              sender={selectedSender}
              isOpen={menuOpen}
              onClose={() => setMenuOpen(false)}
              onMarkAsRead={handleMarkAsRead}
              onRename={handleRename}
              onMoveToFolder={handleMoveToFolder}
              onMuteNotifications={handleMuteNotifications}
              onUnfollow={handleUnfollow}
            />
          </div>
        </div>
      </div>

      {/* Unfollow Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isUnfollowModalOpen}
        onClose={() => setIsUnfollowModalOpen(false)}
        onConfirm={async () => {
          if (selectedSender) {
            await unsubcribeSender(selectedSender.id);
            setIsUnfollowModalOpen(false);
          }
        }}
        itemName={selectedSender.name}
        itemType="sender"
      />

      {/* Mark as Read Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isMarkAsReadModalOpen}
        onClose={() => setIsMarkAsReadModalOpen(false)}
        onConfirm={async () => {
          if (selectedSender) {
            await toggleReadSender(selectedSender.id, !selectedSender.isRead);
            setIsMarkAsReadModalOpen(false);
          }
        }}
        itemName={selectedSender.name}
        itemType={selectedSender.isRead ? "markasunread" : "markasread"}
      />

      {/* Edit Sender Modal */}
      <EditSenderModal
        isOpen={isRenaming}
        onClose={() => setIsRenaming(false)}
        onSave={async (newName: string) => {
          if (selectedSender) {
            await renameSender(selectedSender.id, newName);
            setIsRenaming(false);
          }
        }}
        initialValues={{
          source: selectedSender.domain || "",
          title: selectedSender.name,
          folder: "No Folder"
        }}
      />
    </>
  );
};