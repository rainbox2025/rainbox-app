import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMails } from "@/context/mailsContext";
import { XIcon, RefreshCcw, CheckIcon } from "lucide-react";
import { useSenders } from "@/context/sendersContext";
export const SenderHeader = ({
  filter,
  setFilter,
  unreadCount,
}: {
  filter: string;
  setFilter: (filter: string) => void;
  unreadCount: number;
}) => {
  const {
    refreshMails,
    markAsReadAllBySenderId,
    selectedMail,
    setSelectedMail,
  } = useMails();
  const { selectedSender } = useSenders();
  return (
    <div className="flex flex-row items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <h1 className="text-xl font-semibold">{selectedSender?.name}</h1>
      <div className="flex flex-row items-center gap-2">
        <Select onValueChange={setFilter} value={filter}>
          <SelectTrigger className="h-9 w-[140px] border-none bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unread">Unread ({unreadCount})</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => markAsReadAllBySenderId(selectedSender?.id!)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <CheckIcon className="w-4 h-4" />
        </button>
        <button
          className="p-2 rounded-full hover:bg-muted transition-colors"
          onClick={() => {
            refreshMails();
          }}
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
        {selectedMail && (
          <button
            className="p-2 rounded-full hover:bg-muted transition-colors"
            onClick={() => setSelectedMail(null)}
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
