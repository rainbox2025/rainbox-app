"use client";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMails } from "@/context/mailsContext";
import { RefreshCcw, CheckIcon, MoreHorizontal, Menu, X } from "lucide-react";
import { useSenders } from "@/context/sendersContext";
import { useFolders } from "@/context/foldersContext";
import { useSidebar } from "@/context/sidebarContext";
import { SenderDropdownMenu } from "../sidebar/sender-dropdown-menu";
import { DeleteConfirmationModal } from "../modals/delete-modal";
import { EditSenderModal } from "../modals/edit-sender-modal";

export const SenderHeader = ({
  filter,
  setFilter,
  unreadCount,
}: {
  filter: string;
  setFilter: (filter: string) => void;
  unreadCount: number;
}) => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { refreshMails, markAsReadAllBySenderId } = useMails();
  const {
    selectedSender,
    unsubcribeSender,
    toggleReadSender,
    toggleNotificationSender,
    unsubscribingId,
    togglingReadId,
    togglingNotificationId,
  } = useSenders();
  const { updateSenderInUI } = useFolders();

  // State management for dropdown and all associated modals
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMarkAsReadModalOpen, setIsMarkAsReadModalOpen] = useState(false);
  const [isUnfollowModalOpen, setIsUnfollowModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);

  // Reusable handler to close menu and open a modal/start an action
  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    action();
  };

  return (
    <>
      <div className="flex flex-row items-center justify-between p-sm h-header border-b border-border sticky top-0 bg-content/95 backdrop-blur-sm z-10">
        <div className="flex items-center flex-1 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-full mr-2 md:hidden"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <h1
            className={`font-semibold ml-1 text-md truncate ${!selectedSender?.isRead ? "text-primary" : "text-muted-foreground"}`}
          >
            {selectedSender ? selectedSender.name : "All Mails"}
          </h1>
        </div>

        <div className="flex flex-row items-center gap-1 flex-shrink-0">
          <Select onValueChange={setFilter} value={filter}>
            <SelectTrigger className="h-6 w-[110px] md:w-[140px] border-none bg-muted text-muted-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="text-muted-foreground" value="all">All</SelectItem>
              <SelectItem className="text-muted-foreground" value="unread">Unread ({unreadCount})</SelectItem>
              <SelectItem className="text-muted-foreground" value="bookmarked">Bookmarked</SelectItem>
            </SelectContent>
          </Select>
          <button
            className="p-xs rounded-full hover:bg-muted transition-colors"
            onClick={() => refreshMails()}
            title="Refresh"
          >
            <RefreshCcw className="w-4 h-4 text-muted-foreground" />
          </button>

          {selectedSender && (
            <>
              <button
                onClick={handleAction(() => setIsMarkAsReadModalOpen(true))}
                className="p-xs rounded-full hover:bg-muted transition-colors"
                title={selectedSender.isRead ? "Mark as Unread" : "Mark as Read"}
              >
                <CheckIcon className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  className="p-xs rounded-full hover:bg-muted transition-colors"
                  title="More actions"
                >
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>

                <SenderDropdownMenu
                  sender={selectedSender}
                  isOpen={menuOpen}
                  onClose={() => setMenuOpen(false)}
                  onMarkAsRead={handleAction(() => setIsMarkAsReadModalOpen(true))}
                  onRename={handleAction(() => setIsEditing(true))}
                  onMoveToFolder={handleAction(() => setIsEditing(true))}
                  onMuteNotifications={handleAction(() => setIsMuteModalOpen(true))}
                  onUnfollow={handleAction(() => setIsUnfollowModalOpen(true))}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* All Modals are now here, managed by this component's state */}
      {selectedSender && (
        <>
          <DeleteConfirmationModal
            isOpen={isUnfollowModalOpen}
            onClose={() => setIsUnfollowModalOpen(false)}
            onConfirm={() => unsubcribeSender(selectedSender.id)}
            itemName={selectedSender.name}
            itemType="sender"
            isLoading={unsubscribingId === selectedSender.id}
          />

          <DeleteConfirmationModal
            isOpen={isMarkAsReadModalOpen}
            onClose={() => setIsMarkAsReadModalOpen(false)}
            onConfirm={async () => {
              const updatedSender = await toggleReadSender(selectedSender.id);
              updateSenderInUI(selectedSender, updatedSender);
            }}
            itemName={selectedSender.name}
            itemType={selectedSender.isRead ? "markasunread" : "markasread"}
            isLoading={togglingReadId === selectedSender.id}
          />

          <DeleteConfirmationModal
            isOpen={isMuteModalOpen}
            onClose={() => setIsMuteModalOpen(false)}
            onConfirm={async () => {
              const updatedSender = await toggleNotificationSender(selectedSender.id, selectedSender.notification as boolean);
              updateSenderInUI(selectedSender, updatedSender);
            }}
            itemName={selectedSender.name}
            itemType={selectedSender.notification ? "mutenotification" : "unmutenotification"}
            isLoading={togglingNotificationId === selectedSender.id}
          />

          {isEditing && (
            <EditSenderModal
              isOpen={isEditing}
              onClose={() => setIsEditing(false)}
              sender={selectedSender}
            />
          )}
        </>
      )}
    </>
  );
};