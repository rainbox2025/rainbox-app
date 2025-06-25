"use client";
import React, { useEffect, useState, useRef } from "react";
import { useBookmarks, Bookmark as BookmarkType } from "@/context/bookmarkContext";
import { BookmarkedItemsList } from "@/components/bookmark/bookmarked-item-list";
import { MailReader } from "@/components/mails/mail-reader";
import { useMails } from "@/context/mailsContext";
import { Mail } from "@/types/data";
import { useAxios } from "@/hooks/useAxios";
import { Loader2, Menu, X } from "lucide-react";
import { BookOpenIcon as OutlineBookOpenIcon } from "@heroicons/react/24/outline";
import { useSidebar } from "@/context/sidebarContext";

const BookmarkPage = () => {
  const { bookmarks: allBookmarksFromContext, isLoading: isLoadingBookmarks } = useBookmarks();
  const { mails, setSelectedMail, selectedMail: mailFromContext, isMailsLoading } = useMails();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const api = useAxios();

  const [selectedBookmarkInList, setSelectedBookmarkInList] = useState<BookmarkType | null>(null);
  const [isFetchingMail, setIsFetchingMail] = useState(false);
  const [readerWidth, setReaderWidth] = useState(50);
  const [listVisible, setListVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const showReader = mailFromContext || isFetchingMail;
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setListVisible(!showReader);
      } else {
        setListVisible(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mailFromContext, isFetchingMail]);

  useEffect(() => {
    const showReader = mailFromContext || isFetchingMail;
    if (!showReader) {
      setListVisible(true);
    } else if (isMobile) {
      setListVisible(false);
    }
  }, [mailFromContext, isMobile, isFetchingMail]);


  const bookmarksToDisplay = allBookmarksFromContext;

  const handleSelectBookmark = async (bookmarkToOpen: BookmarkType) => {
    setSelectedBookmarkInList(bookmarkToOpen);
    setSelectedMail(null); // Clear previous mail to trigger loading state

    if (!bookmarkToOpen.mailId) {
      console.warn(`Bookmark ${bookmarkToOpen.id} has no mailId.`);
      return;
    }

    let mailToDisplay = mails.find(mail => mail.id === bookmarkToOpen.mailId);

    if (mailToDisplay) {
      setSelectedMail(mailToDisplay);
    } else {
      // If mail is not in context, fetch it individually
      setIsFetchingMail(true);
      try {
        const response = await api.get<Mail>(`/mails/${bookmarkToOpen.mailId}`);
        setSelectedMail(response.data);
      } catch (error) {
        console.error(`Failed to fetch mail details for ${bookmarkToOpen.mailId}:`, error);
        setSelectedMail(null); // Ensure mail is null on error
      } finally {
        setIsFetchingMail(false);
      }
    }
  };

  const handleBack = () => {
    setSelectedBookmarkInList(null);
    setSelectedMail(null);
  };

  if (isLoadingBookmarks || isMailsLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  const showReader = selectedBookmarkInList && (mailFromContext || isFetchingMail);

  return (
    <div className="flex min-w-fit h-screen overflow-x-auto" ref={containerRef}>
      <div
        className={`flex flex-col h-full transition-all duration-300 ease-in-out
          ${listVisible ? 'block' : 'hidden md:block'}
          ${showReader ? 'md:w-[50%]' : 'w-full md:w-[calc(100%-1px)]'}`}
        style={{ width: showReader && !isMobile ? `${100 - readerWidth}%` : '100%' }}
      >
        <div className="flex items-center flex-1 min-w-0 h-header p-2 border-b border-border">
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-full mr-2 md:hidden"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <h1 className="font-semibold text-md truncate text-muted-foreground ml-2">
            Bookmarks
          </h1>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar" style={{ height: "calc(100vh - 57px)" }}>
          {bookmarksToDisplay.length > 0 ? (
            <BookmarkedItemsList
              bookmarks={bookmarksToDisplay}
              selectedBookmark={selectedBookmarkInList}
              onSelectBookmark={handleSelectBookmark}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4 text-muted-foreground">
              <div className="rounded-full bg-muted p-sm w-16 h-16 flex items-center justify-center">
                <OutlineBookOpenIcon className="w-8 h-8" />
              </div>
              <p className="text-sm">No bookmarks found.</p>
            </div>
          )}
        </div>
      </div>

      {showReader && (
        isFetchingMail ? (
          <div className="flex-grow flex justify-center items-center" style={{ width: !isMobile ? `${readerWidth}%` : '100%' }}>
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
          </div>
        ) : mailFromContext && (
          <MailReader
            containerRef={containerRef}
            mailReaderWidth={readerWidth}
            setMailReaderWidth={setReaderWidth}
            onBack={handleBack}
            mail={mailFromContext}
          />
        )
      )}
    </div>
  );
};

export default BookmarkPage;