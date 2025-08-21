"use client";

import { useSenders } from "@/context/sendersContext";
import { GripVertical } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { useBookmarks } from "@/context/bookmarkContext";
import MailBodyViewer from "./mail-body-viewer";
import SelectionPopup from "@/components/bookmark/selection-modal";
import CommentModal from "../bookmark/comment-modal";
import TagModal from "@/components/bookmark/tag-modal";
import { Mail } from "@/types/data";
import NotesSidebar from "../notes/NotesSidebar";
import { AnimatePresence } from "framer-motion";
import MailReaderHeader from "./mail-reader-header";
import TextToAudio from "../ui/text-to-audio";
import SummaryDialog from "../summary-dialog";
import { SenderIcon } from '@/components/sidebar/sender-icon';
import { cn } from "@/lib/utils";

interface MailReaderProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mailReaderWidth: number;
  setMailReaderWidth: (width: number) => void;
  onBack: () => void;
  mail: Mail | null;
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
}

export const MailReader = ({
  containerRef,
  mailReaderWidth,
  setMailReaderWidth,
  onBack,
  mail,
  isResizing,
  setIsResizing,
}: MailReaderProps) => {
  const resizeRef = useRef<HTMLDivElement>(null);
  const mailBodyRef = useRef<HTMLDivElement>(null);
  const mailReaderRef = useRef<HTMLDivElement>(null);
  const previousWidthRef = useRef(mailReaderWidth);
  const animationFrameRef = useRef<number | null>(null);

  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [textToAudioOpen, setTextToAudioOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNotesSidebarOpen, setNotesSidebarOpen] = useState(false);

  const { senders } = useSenders();
  const { bookmarks, deserializeRange } = useBookmarks();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const isTablet = typeof window !== "undefined" && window.innerWidth >= 768 && window.innerWidth < 1024;

  const mailSender: any = mail
    ? (senders.find(sender => sender.id === mail.sender_id) ||
      { id: mail.id, name: mail.senders.name, domain: mail.senders.domain, image_url: mail.senders.image_url, email: mail.sender })
    : null;

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

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const mousePosition = e.clientX - containerRect.left;
        const mailListWidthPercent = (mousePosition / containerRect.width) * 100;
        const readerWidthPercent = 100 - mailListWidthPercent;

        setMailReaderWidth(Math.max(50, Math.min(60, readerWidthPercent)));
        setIsFullScreen(false);
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    if (isResizing) {
      document.body.style.cursor = "col-resize";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isResizing, containerRef, setMailReaderWidth, setIsResizing]);

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
    if (!range) return;

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
      
      const highlights = rootElement.querySelectorAll(`[data-bookmark-id="${bookmarkId}"]`);
      highlights.forEach((el: any) => {
        el.style.transition = 'background-color 0.5s ease-in-out';
        el.style.backgroundColor = 'rgba(255, 235, 59, 0.3)';
      });
      setTimeout(() => {
        highlights.forEach((el: any) => {
          el.style.backgroundColor = '';
        });
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
      <div
        ref={resizeRef}
        className="w-[2px] relative h-screen cursor-col-resize hidden lg:flex items-center justify-center bg-border hover:bg-dragger z-10"
        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
      >
        <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
      </div>
      <div
        ref={mailReaderRef}
        className={cn(
          "h-screen bg-content border-border animate-in slide-in-from-right w-full md:w-auto relative",
          !isResizing && "transition-all duration-300"
        )}
        style={isFullScreen && !isMobile ? { width: "96%", position: 'absolute', left: '3rem', zIndex: 100 } : (isMobile || isTablet) ? { width: "100%" } : { width: `${mailReaderWidth}%` }}
      >
        <MailReaderHeader
          setSummaryDialogOpen={setSummaryDialogOpen}
          setTextToAudioOpen={setTextToAudioOpen}
          onBack={onBack}
          isFullScreen={isFullScreen}
          toggleFullScreen={toggleFullScreen}
          onOpenNotes={handleOpenNotes}
        />
        <div
          className="h-[calc(100vh-3rem)] overflow-y-auto custom-scrollbar"
        >
          <div
            ref={mailBodyRef}
            className={`p-md pb-64 ${isFullScreen ? 'max-w-xl mx-auto' : 'w-full'}`}
          >
            <h1 className="text-lg font-semibold text-left w-full p-sm pl-0">
              {mail.subject}
            </h1>
            {mailSender &&
              <div className="flex items-center mb-2 text-sm">
                <div className="mr-3 flex-shrink-0">
                  <SenderIcon sender={mailSender} width={28} height={28} />
                </div>
                <div>
                  <div className="font-medium">{mailSender.name} <span className="text-muted-foreground">&lt;{mailSender.email}&gt;</span></div>
                  <div className="text-muted-foreground text-xs">
                    {moment(mail.created_at).format("MMM D, YYYY [at] h:mm A")}
                  </div>
                </div>
              </div>
            }
            <MailBodyViewer key={mail.id} htmlContent={mail.body} mailId={mail.id} />
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