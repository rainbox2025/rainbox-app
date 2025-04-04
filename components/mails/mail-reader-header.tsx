import { Bookmark, ChevronLeft, Share2, Volume2 } from "lucide-react";
import { useMails } from "@/context/mailsContext";
import { useSenders } from "@/context/sendersContext";
import { Sparkles } from "lucide-react";
import React from "react";
import { EnvelopeOpenIcon } from "@heroicons/react/24/outline";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
const MailReaderHeader = ({
  setSummaryDialogOpen,
  setTextToAudioOpen,
}: {
  setSummaryDialogOpen: (open: boolean) => void;
  setTextToAudioOpen: (open: boolean) => void;
}) => {
  const { selectedMail, setSelectedMail, markAsRead, bookmark } = useMails();

  const { selectedSender } = useSenders();
  return (
    selectedMail &&
    selectedSender && (
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-xs flex items-center justify-between gap-2">

        <button
          className="p-sm rounded-full hover:bg-muted transition-colors"
          onClick={() => setSelectedMail(null)}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-semibold truncate max-w-[40%] sm:max-w-[60%]">
          {selectedMail?.subject}
        </h1>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="p-sm rounded-full hover:bg-muted transition-colors"
            onClick={() => setSummaryDialogOpen(true)}
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            className="p-sm rounded-full hover:bg-background/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              bookmark(selectedMail.id, !selectedMail.bookmarked);
              setSelectedMail({
                ...selectedMail,
                bookmarked: !selectedMail.bookmarked,
              });
            }}
          >
            <Bookmark
              fill={selectedMail?.bookmarked ? "currentColor" : "none"}
              className="w-4 h-4"
            />
          </button>
          <button
            className="p-sm rounded-full hover:bg-background/80 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(selectedMail.id, !selectedMail.read);
            }}
          >
            {!selectedMail.read ? (
              <EnvelopeIcon className="w-4 h-4" />
            ) : (
              <EnvelopeOpenIcon className="w-4 h-4" />
            )}
          </button>
          <button
            className="p-sm rounded-full hover:bg-muted transition-colors"
            onClick={() => setTextToAudioOpen(true)}
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            className="p-sm rounded-full hover:bg-muted transition-colors"
            onClick={() => setSelectedMail(null)}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  );
};

export default MailReaderHeader;
