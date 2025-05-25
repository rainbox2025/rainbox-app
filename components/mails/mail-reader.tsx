import { useMails } from "@/context/mailsContext";
import { useSenders } from "@/context/sendersContext";
import { GripVertical } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import TextToAudio from "../ui/text-to-audio";
import SummaryDialog from "../summary-dialog";
import moment from "moment";
import MailReaderHeader from "./mail-reader-header";
import SenderAvatar from "../sender-avatar";
import { BookmarkProvider } from "@/context/bookmarkContext";
import MailBodyViewer from "../bookmark/mail-body-viewer";
import SelectionPopup from "../bookmark/selection-popup";
import CommentModal from "../bookmark/comment-modal";

export const MailReader = ({
  containerRef,
  mailReaderWidth,
  setMailReaderWidth,
  onBack
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mailReaderWidth: number;
  setMailReaderWidth: (width: number) => void;
  onBack: () => void;
}) => {
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const { selectedMail, setSelectedMail, markAsRead, bookmark } = useMails();
  const { selectedSender, senders } = useSenders();
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [textToAudioOpen, setTextToAudioOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const previousWidthRef = useRef(mailReaderWidth);

  // Find sender associated with selected mail
  const mailSender = selectedSender ||
    (selectedMail && senders.find(sender => sender.id === selectedMail.sender_id)) ||
    { name: "Unknown Sender", domain: "unknown.com" };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef?.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;

      // Calculate the position from the left edge of the container
      const mousePosition = e.clientX - containerRect.left;

      // Convert to percentage - this is the width of the mail list
      const mailListWidthPercent = (mousePosition / containerWidth) * 100;

      // Since mailReaderWidth is the width of the reader (right panel),
      // we need to invert the percentage (100 - mailListWidth)
      const readerWidthPercent = 100 - mailListWidthPercent;

      // Constrain between 15% and 85% for the reader width
      const constrainedWidth = Math.max(50, Math.min(60, readerWidthPercent));

      setMailReaderWidth(constrainedWidth);
      setIsFullScreen(false);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
    };

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
      // Return to previous width
      setMailReaderWidth(previousWidthRef.current);
    } else {
      // Save current width before going fullscreen
      previousWidthRef.current = mailReaderWidth;
      // Set to fullscreen (adjust for left panel - 5rem)
      setMailReaderWidth(95); // 100% - 5rem (left panel)
    }
    setIsFullScreen(!isFullScreen);
  };

  return (
    selectedMail && (
      <>
        <div
          ref={resizeRef}
          className="w-[2px] relative h-screen cursor-col-resize hidden md:flex items-center justify-center bg-border hover:bg-dragger z-10 transition-all duration-200"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        >
          <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
        </div>

        <div
          ref={mailReaderRef} // Add ref to mail reader container
          className="h-screen custom-scrollbar bg-content border-border overflow-y-auto transition-all duration-300 animate-in slide-in-from-right w-full md:w-auto relative" // Add relative positioning
          style={isFullScreen ? { width: "96%", position: 'absolute', left: '3rem', zIndex: 100 } : { width: `${mailReaderWidth}%` }}
        >
          <MailReaderHeader
            setSummaryDialogOpen={setSummaryDialogOpen}
            setTextToAudioOpen={setTextToAudioOpen}
            onBack={onBack}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
          />
          <div className="p-md pb-64"> {/* Keep bottom padding to prevent content being hidden */}
            <div className={`${isFullScreen ? 'max-w-xl mx-auto' : 'w-full'}`}>
              <h1 className="text-lg font-semibold text-left w-full p-sm pl-0">
                {selectedMail?.subject}
              </h1>
              <div className="flex items-center mb-2 text-sm">
                <SenderAvatar
                  domain={mailSender?.domain || ""}
                  alt={selectedMail.subject || ""}
                />
                <div>
                  <div className="font-medium">{mailSender?.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {moment(selectedMail.created_at).format(
                      "MMM D, YYYY [at] h:mm A"
                    )}
                  </div>
                </div>
              </div>
              <BookmarkProvider>
                {selectedMail && (
                  <MailBodyViewer
                    htmlContent={selectedMail.body}
                    mailId={selectedMail.id}
                  />
                )}
                <SelectionPopup />
                <CommentModal />
              </BookmarkProvider>
            </div>
          </div>

          {/* Position dialogs at the bottom of mail reader */}
          {textToAudioOpen && (
            <TextToAudio
              open={textToAudioOpen}
              onOpenChange={(open) => {
                setTextToAudioOpen(open);
              }}
              containerRef={mailReaderRef} // Pass ref to the component
            />
          )}

          {summaryDialogOpen && (
            <SummaryDialog
              open={summaryDialogOpen}
              onOpenChange={setSummaryDialogOpen}
              containerRef={mailReaderRef} // Pass ref to the component
            />
          )}
        </div>
      </>
    )
  );
};

export default MailReader;