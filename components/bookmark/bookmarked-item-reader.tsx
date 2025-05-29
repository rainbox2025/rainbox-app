import React, { useEffect, useRef, useState } from 'react';
import { Bookmark as BookmarkType, useBookmarks } from '@/context/bookmarkContext';
import { GripVertical, Loader2 } from 'lucide-react';
import BookmarkReaderHeader from './bookmarked-reader-header';
import MailBodyViewer from '@/components/bookmark/mail-body-viewer'; // Assuming this exists and works with BookmarkProvider
import SelectionPopup from "@/components/bookmark/selection-modal";
import CommentModal from "@/components/bookmark/comment-modal";
import TagModal from "@/components/bookmark/tag-modal";
import { useMails } from '@/context/mailsContext'; // To fetch mail body if needed

interface Props {
  bookmark: BookmarkType;
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  readerWidth: number;
  setReaderWidth: (width: number) => void;
  onBack?: () => void;
}

export const BookmarkedItemReader: React.FC<Props> = ({ bookmark, onClose, containerRef, readerWidth, setReaderWidth, onBack }) => {
  const resizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const previousWidthRef = useRef(readerWidth);
  const readerContentRef = useRef<HTMLDivElement>(null); // For MailBodyViewer root element for deserialization

  const { mails } = useMails(); // Get all mails from context
  const { deserializeRange } = useBookmarks();
  const [contentToDisplay, setContentToDisplay] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  const LEFT_PANEL_WIDTH = 48; // px, match LeftPanel

  useEffect(() => {
    setIsLoadingContent(true);
    if (bookmark.mailId) {
      const mail = mails.find(m => m.id === bookmark.mailId);
      if (mail) {
        setContentToDisplay(mail.body);
      } else {
        // Mail not found in context, might need to fetch it individually if API allows
        // For now, fallback to bookmark text
        console.warn(`Mail for bookmark ${bookmark.id} (mailId: ${bookmark.mailId}) not found in context.`);
        setContentToDisplay(`<p><em>Original email content not available. Highlighted text:</em></p><p>${bookmark.text}</p>`);
      }
    } else {
      // If no mailId, it's likely a non-email highlight. Use its text.
      // This part might need a different renderer if it's not HTML.
      setContentToDisplay(`<p>${bookmark.text}</p>`);
    }
    setIsLoadingContent(false);
  }, [bookmark, mails]);

  // Auto-scroll to highlight
  useEffect(() => {
    if (contentToDisplay && readerContentRef.current && bookmark.serializedRange) {
      // Ensure content is rendered before trying to deserialize
      const timeoutId = setTimeout(() => {
        if (!readerContentRef.current) return;
        const range = deserializeRange(bookmark.serializedRange, readerContentRef.current);
        if (range) {
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range.cloneRange()); // Select to make it visible

          const rangeRect = range.getBoundingClientRect();
          const containerRect = readerContentRef.current.getBoundingClientRect();

          readerContentRef.current.scrollTo({
            top: rangeRect.top - containerRect.top + readerContentRef.current.scrollTop - (containerRect.height / 4), // scroll to 1/4 from top
            behavior: 'smooth'
          });
        } else {
          console.warn("Could not deserialize range for bookmark:", bookmark.id);
        }
      }, 100); // Delay to allow DOM to update, adjust as needed
      return () => clearTimeout(timeoutId);
    }
  }, [bookmark, contentToDisplay, deserializeRange]);


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef?.current) return;
      const cRect = containerRef.current.getBoundingClientRect();
      const mouseXInContainer = e.clientX - cRect.left;
      const listPanelWPercent = (mouseXInContainer / cRect.width) * 100;
      const newReaderWPercent = 100 - listPanelWPercent;
      const constrainedW = Math.max(30, Math.min(70, newReaderWPercent));
      setReaderWidth(constrainedW);
      if (isFullScreen) setIsFullScreen(false);
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
  }, [isResizing, containerRef, setReaderWidth, isFullScreen]);

  const toggleFullScreen = () => {
    if (isFullScreen) setReaderWidth(previousWidthRef.current);
    else { previousWidthRef.current = readerWidth; setReaderWidth(100 - (LEFT_PANEL_WIDTH / window.innerWidth * 100)); } // Full width minus left panel
    setIsFullScreen(!isFullScreen);
  };

  return (
    <>
      <div
        ref={resizeRef}
        className="w-[2px] relative h-screen cursor-col-resize hidden md:flex items-center justify-center bg-border hover:bg-dragger z-10"
        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
      >
        <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
      </div>
      <div
        className="h-screen bg-content border-border overflow-y-auto custom-scrollbar transition-all duration-300 relative"
        style={isFullScreen ? { width: `calc(100% - ${LEFT_PANEL_WIDTH}px)`, position: 'absolute', left: `${LEFT_PANEL_WIDTH}px`, zIndex: 50 } : { width: `${readerWidth}%` }}
      >
        <BookmarkReaderHeader bookmark={bookmark} onClose={onClose} onBack={onBack} isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen} />
        <div className="p-md pb-64 overflow-y-auto h-[calc(100%-theme(space.16))]" ref={readerContentRef}> {/* Ensure this is scrollable for highlight finding */}
          <div className={`${isFullScreen ? 'max-w-2xl mx-auto' : 'w-full'}`}>
            {isLoadingContent ? (
              <div className="flex justify-center items-center py-10"><Loader2 className="animate-spin w-6 h-6 text-primary" /></div>
            ) : contentToDisplay ? (
              <MailBodyViewer htmlContent={contentToDisplay} mailId={bookmark.mailId} />
            ) : (
              <p className="text-muted-foreground p-md">Content not available for this bookmark.</p>
            )}
            {/* Modals for interactions, controlled by BookmarkContext */}
            <SelectionPopup />
            <CommentModal />
            <TagModal />
          </div>
        </div>
      </div>
    </>
  );
};