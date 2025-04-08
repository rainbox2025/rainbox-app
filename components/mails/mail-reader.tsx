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
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain between 
      const constrainedWidth = Math.max(45, Math.min(60, newWidth));
      setMailReaderWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
    };

    if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
    };
  }, [isResizing]);

  return (
    selectedMail &&
    selectedSender && (
      <>
        <div
          ref={resizeRef}
          className="w-[2px] h-screen cursor-col-resize hidden md:flex items-center justify-center bg-border/80 hover:bg-primary/30 group"
          onMouseDown={() => setIsResizing(true)}
        >
          <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
        </div>

        <div className="min-w-[300px] md:min-w-[460px] h-screen custom-scrollbar bg-content border-border overflow-y-auto transition-all duration-300 animate-in slide-in-from-right w-full md:w-auto">
          <MailReaderHeader
            setSummaryDialogOpen={setSummaryDialogOpen}
            setTextToAudioOpen={setTextToAudioOpen}
            onBack={onBack} // Pass this to header
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