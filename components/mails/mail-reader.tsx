"use client";

import { useMails } from "@/context/mailsContext";
import { useSenders } from "@/context/sendersContext";
import { GripVertical, Loader2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import TextToAudio from "../ui/text-to-audio";
import SummaryDialog from "../summary-dialog";
import moment from "moment";
import MailReaderHeader from "./mail-reader-header";
import SenderAvatar from "../sender-avatar";
import { useBookmarks } from "@/context/bookmarkContext";
import MailBodyViewer from "../bookmark/mail-body-viewer";
import SelectionPopup from "@/components/bookmark/selection-modal";
import CommentModal from "../bookmark/comment-modal";
import TagModal from "@/components/bookmark/tag-modal";
import { Mail } from "@/types/data";
import NotesSidebar from "../notes/NotesSidebar";
import { AnimatePresence } from "framer-motion";

interface MailReaderProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mailReaderWidth: number;
  setMailReaderWidth: (width: number) => void;
  onBack: () => void;
  mail: Mail | null;
}

export const MailReader = ({
  containerRef,
  mailReaderWidth,
  setMailReaderWidth,
  onBack,
  mail
}: MailReaderProps) => {
  const resizeRef = useRef<HTMLDivElement>(null);
  const mailBodyRef = useRef<HTMLDivElement>(null);
  const mailReaderRef = useRef<HTMLDivElement>(null);
  const previousWidthRef = useRef(mailReaderWidth);

  const [isResizing, setIsResizing] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [textToAudioOpen, setTextToAudioOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNotesSidebarOpen, setNotesSidebarOpen] = useState(false);

  const { senders } = useSenders();
  const { bookmarks, deserializeRange } = useBookmarks();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const mailSender = mail ? (senders.find(sender => sender.id === mail.sender_id) || { name: "Unknown Sender", domain: "unknown.com" }) : null;

  useEffect(() => {
    return () => {
      if (isFullScreen) {
        setMailReaderWidth(previousWidthRef.current);
      }
    };
  }, [isFullScreen, setMailReaderWidth]);

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

  const toggleFullScreen = () => {
    if (isFullScreen) {
      setMailReaderWidth(previousWidthRef.current);
    } else {
      previousWidthRef.current = mailReaderWidth;
      setMailReaderWidth(95);
    }
    setIsFullScreen(!isFullScreen);
  };

  const handleOpenNotes = () => {
    if (!isFullScreen) {
      toggleFullScreen();
    }
    setNotesSidebarOpen(true);
  };

  const handleNoteClick = (bookmarkId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    const rootElement = mailBodyRef.current;
    const scrollableParent = mailReaderRef.current;

    if (!bookmark || !rootElement || !scrollableParent || !bookmark.serializedRange) {
      return;
    }

    const range = deserializeRange(bookmark.serializedRange, rootElement);
    if (!range) {
      return;
    }

    const elementToScrollTo = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer as HTMLElement
      : range.startContainer.parentElement;

    if (elementToScrollTo) {
      const scrollContainerRect = scrollableParent.getBoundingClientRect();
      const targetRect = elementToScrollTo.getBoundingClientRect();
      const scrollTop = targetRect.top - scrollContainerRect.top + scrollableParent.scrollTop;

      scrollableParent.scrollTo({
        top: scrollTop - 100,
        behavior: 'smooth',
      });

      elementToScrollTo.style.transition = 'background-color 0.5s ease-in-out';
      elementToScrollTo.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
      setTimeout(() => {
        if (elementToScrollTo) {
          elementToScrollTo.style.backgroundColor = '';
        }
      }, 1500);
    }
  };

  if (!mail) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center p-4 text-center">
        <p className="text-muted-foreground">Select a mail to read.</p>
      </div>
    );
  }

  return (
    <>
      <div ref={resizeRef} className="w-[2px] relative h-screen cursor-col-resize hidden md:flex items-center justify-center bg-border hover:bg-dragger z-10" onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}>
        <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
      </div>
      <div ref={mailReaderRef} className="h-screen custom-scrollbar bg-content border-border overflow-y-auto transition-all duration-300 animate-in slide-in-from-right w-full md:w-auto relative"
        style={isFullScreen && !isMobile ? { width: "96%", position: 'absolute', left: '3rem', zIndex: 100 } : isMobile ? { width: "100%" } : { width: `${mailReaderWidth}%` }}>
        <MailReaderHeader
          setSummaryDialogOpen={setSummaryDialogOpen}
          setTextToAudioOpen={setTextToAudioOpen}
          onBack={onBack}
          isFullScreen={isFullScreen}
          toggleFullScreen={toggleFullScreen}
          onOpenNotes={handleOpenNotes}
        />
        <div className="p-md pb-64">
          <div className={`${isFullScreen ? 'max-w-xl mx-auto' : 'w-full'}`}>
            <h1 className="text-lg font-semibold text-left w-full p-sm pl-0">
              {mail.subject}
            </h1>
            {mailSender &&
              <div className="flex items-center mb-2 text-sm">
                <SenderAvatar domain={mailSender.domain || "unknown.com"} alt={mail.subject} />
                <div>
                  <div className="font-medium">{mailSender.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {moment(mail.created_at).format("MMM D, YYYY [at] h:mm A")}
                  </div>
                </div>
              </div>
            }
            <div ref={mailBodyRef}>
              <MailBodyViewer htmlContent={mail.body} mailId={mail.id} />
            </div>
            <SelectionPopup />
            <CommentModal />
            <TagModal />
          </div>
        </div>
        {textToAudioOpen && <TextToAudio open={textToAudioOpen} onOpenChange={setTextToAudioOpen} containerRef={mailReaderRef} />}
        {summaryDialogOpen && <SummaryDialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen} containerRef={mailReaderRef} />}
      </div>
      <AnimatePresence>
        {isNotesSidebarOpen && isFullScreen && (
          <NotesSidebar
            isOpen={isNotesSidebarOpen}
            onClose={() => setNotesSidebarOpen(false)}
            mailId={mail.id}
            onNoteClick={handleNoteClick}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MailReader;