import { cn } from "@/lib/utils";
import { Mail } from "@/types/data";
import { useMails } from "@/context/mailsContext";
import { useSenders } from "@/context/sendersContext";
import React from "react";
import { Bookmark, CheckIcon } from "lucide-react";
import moment from "moment";
import { SenderIcon } from "@/components/sidebar/sender-icon"; // Import the SenderIcon component

export const MailItem = ({ mail }: { mail: Mail }) => {
  const { selectedMail, setSelectedMail, markAsRead, bookmark } = useMails();
  const { selectedSender, senders } = useSenders();

  // Find the sender for the mail, with a fallback for unknown senders.
  // Added a fallback 'id' to ensure the SenderIcon component works correctly.
  const mailSender = selectedSender ||
    senders.find(sender => sender.id === mail.sender_id) ||
    { id: "unknown", name: "Unknown Sender", domain: "unknown.com" };

  return (
    <div
      key={mail.id}
      onClick={async () => {
        setSelectedMail(mail);
        if (!mail.read) {
          await markAsRead(mail.id, true);
        }
      }}
      className={cn(
        "flex flex-col border-b right-[-3px] w-[99%] border-border p-sm px-md cursor-pointer relative group",
        selectedMail?.id === mail.id && "bg-blue-300/20 border-[1.5px] rounded-md border-blue-300 ",
      )}
    >
      <div
        className={`absolute bottom-2 right-4 flex z-5 transition-opacity group-hover:opacity-100 ${mail.bookmarked ? '' : 'opacity-0'
          }`}
      >
        <button
          className="p-xs rounded-full hover:bg-content/80 transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            markAsRead(mail.id, !mail.read);
          }}
          title={mail.read ? "Mark as unread" : "Mark as read"}
        >
          <CheckIcon className="w-4 h-4 text-muted-foreground hover:bg-accent hover:text-foreground" />
        </button>

        {(mail.bookmarked) ? (
          <button
            className="p-xs rounded-full hover:bg-content/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              bookmark(mail.id, false);
            }}
            title="Unbookmark"
          >
            <Bookmark
              fill="currentColor"
              className="w-4 h-4 text-muted-foreground hover:bg-accent hover:text-foreground"
            />
          </button>
        ) : (
          <button
            className="p-xs rounded-full hover:bg-content/80 transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              bookmark(mail.id, true);
            }}
            title="Bookmark"
          >
            <Bookmark
              fill="none"
              className="w-4 h-4 text-muted-foreground hover:bg-accent hover:text-foreground"
            />
          </button>
        )}
      </div>

      <div className="pr-12">
        <h2
          className={cn(
            "line-clamp-2 mb-1 text-base min-h-[2.5rem] font-bold",
            mail.read ? "text-muted-foreground/80" : "text-muted-foreground"
          )}
        >
          {mail.subject}
        </h2>
        <div className={cn(
          "flex w-full items-baseline justify-start gap-x-2 text-sm",
          mail.read && "text-muted-foreground"
        )}>
          {/* Using SenderIcon to display the sender's avatar */}
          <div className="flex min-w-0 items-center gap-x-2">
            <SenderIcon sender={mailSender} />
            <p className="truncate">
              {mailSender?.name}
            </p>
          </div>
          <p className="flex-shrink-0 whitespace-nowrap text-xs text-muted-foreground mx-2">
            {moment(mail.created_at).fromNow()}
          </p>
        </div>
      </div>
    </div>
  );
};