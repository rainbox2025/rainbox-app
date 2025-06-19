import { cn } from "@/lib/utils";
import { Mail } from "@/types/data";
import { useMails } from "@/context/mailsContext";
import { useSenders } from "@/context/sendersContext";
import React from "react";
import { EnvelopeIcon, EnvelopeOpenIcon } from "@heroicons/react/24/outline";

import { Bookmark, CheckIcon, MoreHorizontal } from "lucide-react";
import moment from "moment";

export const MailItem = ({ mail }: { mail: Mail }) => {
  const { selectedMail, setSelectedMail, markAsRead, bookmark } = useMails();
  const { selectedSender, senders } = useSenders();

  // Find sender associated with this mail (for cases when no sender is selected)
  const mailSender = selectedSender ||
    senders.find(sender => sender.id === mail.sender_id) ||
    { name: "Unknown Sender", domain: "unknown.com" };


  console.log("mail: ", mail)
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
        {/* Read icon: only on hover */}
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

        {/* Bookmark icon: always if true, else only on hover */}
        {(mail.bookmarked || mail.is_confirmed) ? (
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
        <div
          className={cn(
            "flex flex-row items-center text-sm",
            mail.read && "text-muted-foreground"
          )}
        >
          <img
            src={
              mailSender?.domain === "gmail.com"
                ? "/gmail.webp"
                : `https://www.google.com/s2/favicons?domain=${mailSender?.domain}&sz=128`
            }
            alt={mail.subject}
            className="w-4 h-4 object-cover mr-2"
          />
          <span className="mr-2">{mailSender?.name}</span>
          <span className="text-xs text-muted-foreground">
            {moment(mail.created_at).fromNow()}
          </span>
        </div>
      </div>
    </div>
  );
};