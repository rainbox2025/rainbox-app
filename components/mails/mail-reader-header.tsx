import {
  Bookmark,
  CheckIcon,
  ChevronLeft,
  PlayIcon,
  Share2,
  Volume2,
  Maximize2,
  Minimize2,
  FileText
} from "lucide-react";
import { useMails } from "@/context/mailsContext";
import { useSenders } from "@/context/sendersContext";
import React, { useState } from "react";
import {
  EnvelopeOpenIcon,
  EnvelopeIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion"

const MailReaderHeader = ({
  setSummaryDialogOpen,
  setTextToAudioOpen,
  onBack,
  isFullScreen,
  toggleFullScreen,
  onOpenNotes
}: {
  setSummaryDialogOpen: (open: boolean) => void;
  setTextToAudioOpen: (open: boolean) => void;
  onBack: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  onOpenNotes: () => void;
}) => {
  const { selectedMail, setSelectedMail, markAsRead, bookmark } = useMails();
  const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText("your-link-here")
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  const handleBack = () => {
    if (window.innerWidth < 768 && onBack) {
      onBack();
    } else {
      // On desktop, close the mail
      setSelectedMail(null);
    }
  };

  return (
    selectedMail && (
      <div className="sticky top-0 z-10 bg-content h-header border-b border-border p-sm flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <button
            className="p-xs rounded-full bg-content hover:bg-muted transition-colors flex-shrink-0"
            onClick={() => { setSelectedMail(null); handleBack(); }}
            title="Close"
          >
            <XMarkIcon className="w-4 h-4 text-muted-foreground stroke-[2]" />
          </button>
          {!isMobileView && (
            <button
              className="p-xs rounded-full bg-content hover:bg-muted transition-colors flex-shrink-0"
              onClick={toggleFullScreen}
              title={isFullScreen ? "Exit full screen" : "Full screen"}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}

        </div>

        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
          <button
            className="p-xs rounded-full hover:bg-muted transition-colors"
            onClick={() => setSummaryDialogOpen(true)}
            title="Summarize"
          >
            <SparklesIcon className="w-4 h-4 text-muted-foreground hover:bg-accent hover:text-foreground" />
          </button>

          <button
            className="p-xs rounded-full hover:bg-muted transition-colors"
            onClick={() => setTextToAudioOpen(true)}
            title="Text to Audio"
          >
            <PlayIcon className="w-4 h-4 text-muted-foreground hover:bg-accent hover:text-foreground" />
          </button>

          <button
            className="p-xs rounded-full hover:bg-muted transition-colors"
            onClick={onOpenNotes}
            title="View Notes"
          >
            <FileText className="w-4 h-4 text-muted-foreground hover:bg-accent hover:text-foreground" />
          </button>

          <button
            className="p-xs rounded-full hover:bg-muted transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(selectedMail.id, !selectedMail.read);
            }}
            title={selectedMail.read ? "Mark as unread" : "Mark as read"}
          >
            {selectedMail.read ? (
              <CheckIcon className="w-4 h-4 text-muted-foreground" />
            ) : (
              <CheckIcon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <button
            className="p-xs rounded-full hover:bg-muted transition-colors" // MODIFIED: Simplified hover effect
            onClick={(e) => {
              e.stopPropagation();
              // The context now handles the setSelectedMail update, so we just call bookmark
              bookmark(selectedMail.id, !selectedMail.bookmarked);
            }}
            title={
              selectedMail.bookmarked ? "Remove Bookmark" : "Add Bookmark"
            }
          >
            <Bookmark
              fill={selectedMail?.bookmarked ? "currentColor" : "none"}
              className="w-4 h-4 text-muted-foreground" // MODIFIED: Simplified hover effect
            />
          </button>

          <button
            className="p-1 rounded-full hover:bg-muted transition-colors"
            onClick={handleShare}
            title={copied ? "Copied!" : "Copy link"}
          >
            <Share2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>

          <AnimatePresence>
            {copied && (
              <motion.div
                className="absolute right-0 top-full mt-1 bg-muted text-foreground px-2 py-1 rounded text-xs shadow z-10"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                Link copied
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div >
    )
  );
};

export default MailReaderHeader;