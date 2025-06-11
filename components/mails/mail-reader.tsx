import { useMails } from "@/context/mailsContext"; // Assuming Mail type is exported
import { useSenders } from "@/context/sendersContext";
import { GripVertical, Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import TextToAudio from "../ui/text-to-audio";
import SummaryDialog from "../summary-dialog";
import moment from "moment";
import MailReaderHeader from "./mail-reader-header";
import SenderAvatar from "../sender-avatar";
import { BookmarkProvider, Bookmark } from "@/context/bookmarkContext"; // Assuming Bookmark type is exported
import MailBodyViewer from "../bookmark/mail-body-viewer";
import SelectionPopup from "@/components/bookmark/selection-modal";
import CommentModal from "../bookmark/comment-modal";
import TagModal from "@/components/bookmark/tag-modal";
import { Mail } from "@/types/data";

interface MailReaderProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mailReaderWidth: number;
  setMailReaderWidth: (width: number) => void;
  onBack: () => void;
  // ** NEW PROP to fix bug #2 **
  bookmark?: Bookmark;
}

export const MailReader = ({
  containerRef,
  mailReaderWidth,
  setMailReaderWidth,
  onBack,
  bookmark
}: MailReaderProps) => {
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const { selectedMail: globalSelectedMail, mails } = useMails();
  const { senders } = useSenders();

  // Local state to hold the mail being displayed.
  const [mailToDisplay, setMailToDisplay] = useState<Mail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ** FIX for Bug #2: Logic to determine which mail to show **
  useEffect(() => {
    setIsLoading(true);
    let mail: Mail | undefined | null = null;
    if (bookmark) {
      // If a bookmark is passed, find its mail. This is for the /bookmarks page.
      mail = mails.find(m => m.id === bookmark.mailId);
    } else {
      // Otherwise, use the globally selected mail. This is for the main inbox.
      mail = globalSelectedMail;
    }

    setMailToDisplay(mail || null);
    setIsLoading(false);
  }, [bookmark, globalSelectedMail, mails]);

  const mailSender = mailToDisplay ? (senders.find(sender => sender.id === mailToDisplay.sender_id) || { name: "Unknown Sender", domain: "unknown.com" }) : null;

  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [textToAudioOpen, setTextToAudioOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const previousWidthRef = useRef(mailReaderWidth);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef?.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const mousePosition = e.clientX - containerRect.left;
      const mailListWidthPercent = (mousePosition / containerRect.width) * 100;
      const readerWidthPercent = 100 - mailListWidthPercent;
      setMailReaderWidth(Math.max(50, Math.min(60, readerWidthPercent)));
      setIsFullScreen(false);
    };
    const handleMouseUp = () => { setIsResizing(false); document.body.style.cursor = "default"; };
    if (isResizing) {
      document.body.style.cursor = "col-resize";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, containerRef, setMailReaderWidth]);

  const mailReaderRef = useRef<HTMLDivElement>(null);

  const toggleFullScreen = () => {
    if (isFullScreen) {
      setMailReaderWidth(previousWidthRef.current);
    } else {
      previousWidthRef.current = mailReaderWidth;
      setMailReaderWidth(95);
    }
    setIsFullScreen(!isFullScreen);
  };

  if (isLoading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mailToDisplay) {
    // This case handles when the reader should be closed or show an empty state.
    // If called from the bookmarks page with a missing mail, it will show this message.
    return (
      <div className="flex-1 h-screen flex items-center justify-center p-4 text-center">
        <p className="text-muted-foreground">Original email not found.</p>
      </div>
    );
  }

  return (
    <>
      <div ref={resizeRef} className="w-[2px] relative h-screen cursor-col-resize hidden md:flex items-center justify-center bg-border hover:bg-dragger z-10" onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}>
        <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
      </div>
      <div ref={mailReaderRef} className="h-screen custom-scrollbar bg-content border-border overflow-y-auto transition-all duration-300 animate-in slide-in-from-right w-full md:w-auto relative"
        style={isFullScreen ? { width: "96%", position: 'absolute', left: '3rem', zIndex: 100 } : isMobile ? { width: "100%" } : { width: `${mailReaderWidth}%` }}>
        <MailReaderHeader setSummaryDialogOpen={setSummaryDialogOpen} setTextToAudioOpen={setTextToAudioOpen} onBack={onBack} isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen} />
        <div className="p-md pb-64">
          <div className={`${isFullScreen ? 'max-w-xl mx-auto' : 'w-full'}`}>
            <h1 className="text-lg font-semibold text-left w-full p-sm pl-0">
              {mailToDisplay.subject}
            </h1>
            {mailSender &&
              <div className="flex items-center mb-2 text-sm">
                <SenderAvatar domain={mailSender.domain || "unknown.com"} alt={mailToDisplay.subject} />
                <div>
                  <div className="font-medium">{mailSender.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {moment(mailToDisplay.created_at).format("MMM D, YYYY [at] h:mm A")}
                  </div>
                </div>
              </div>
            }
            <BookmarkProvider>
              <MailBodyViewer htmlContent={mailToDisplay.body} mailId={mailToDisplay.id} />
              <SelectionPopup />
              <CommentModal />
              <TagModal />
            </BookmarkProvider>
          </div>
        </div>
        {textToAudioOpen && <TextToAudio open={textToAudioOpen} onOpenChange={setTextToAudioOpen} containerRef={mailReaderRef} />}
        {summaryDialogOpen && <SummaryDialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen} containerRef={mailReaderRef} />}
      </div>
    </>
  );
};

export default MailReader;