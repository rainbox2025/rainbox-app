import { useMails } from "@/context/mailsContext";
import { useSenders } from "@/context/sendersContext";
import { GripVertical, Sparkles } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import TextToAudio from "../ui/text-to-audio";
import SummaryDialog from "../summary-dialog";
import moment from "moment";
import MailReaderHeader from "./mail-reader-header";
import SenderAvatar from "../sender-avatar";

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
  const { selectedSender } = useSenders();
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [textToAudioOpen, setTextToAudioOpen] = useState(false);

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
  }, [isResizing, containerRef, setMailReaderWidth]); // Complete dependency array

  return (
    selectedMail &&
    selectedSender && (
      <>
        <div
          ref={resizeRef}
          className="w-[2px] h-screen cursor-col-resize hidden md:flex items-center justify-center bg-border hover:bg-dragger z-10 transition-all duration-200"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizing(true);
          }}
        >
          <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
        </div>

        <div
          className="h-screen custom-scrollbar bg-content border-border overflow-y-auto transition-all duration-300 animate-in slide-in-from-right w-full md:w-auto"
          style={{ width: window.innerWidth >= 768 ? `${mailReaderWidth}%` : "100%" }}
        >
          <MailReaderHeader
            setSummaryDialogOpen={setSummaryDialogOpen}
            setTextToAudioOpen={setTextToAudioOpen}
            onBack={onBack}
          />
          <div className="p-md">
            <h1 className="text-lg font-semibold text-left w-full p-sm pl-0">
              {selectedMail?.subject}
            </h1>
            <div className="flex items-center mb-2 text-sm">
              <SenderAvatar
                domain={selectedSender.domain || ""}
                alt={selectedMail.subject || ""}
              />
              <div>
                <div className="font-medium">{selectedSender?.name}</div>
                <div className="text-muted-foreground text-xs">
                  {moment(selectedMail.created_at).format(
                    "MMM D, YYYY [at] h:mm A"
                  )}
                </div>
              </div>
            </div>
            <div
              className="prose text-sm prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedMail.body }}
            />
          </div>
        </div>
        <SummaryDialog
          open={summaryDialogOpen}
          onOpenChange={setSummaryDialogOpen}
        />
        <TextToAudio
          open={textToAudioOpen}
          onOpenChange={(open) => {
            setTextToAudioOpen(open);
            if (!open) {
              setSelectedMail(null);
            }
          }}
        />
      </>
    )
  );
};

export default MailReader;