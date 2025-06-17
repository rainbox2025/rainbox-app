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
  const [readerWidth, setReaderWidth] = useState(50);
  const [listVisible, setListVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("mailFromContext: ", mailFromContext)
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setListVisible(!mailFromContext);
      } else {
        setListVisible(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mailFromContext]);

  useEffect(() => {
    if (!mailFromContext) {
      setListVisible(true);
    } else if (isMobile) {
      setListVisible(false);
    }
  }, [mailFromContext, isMobile]);

  const bookmarksToDisplay = allBookmarksFromContext;

  const handleSelectBookmark = async (bookmarkToOpen: BookmarkType) => {
    setSelectedBookmarkInList(bookmarkToOpen);

    if (!bookmarkToOpen.mailId) {
      console.warn(`Bookmark ${bookmarkToOpen.id} has no mailId.`);
      setSelectedMail(null);
      return;
    }

    let mailToDisplay = mails.find(mail => mail.id === bookmarkToOpen.mailId);


    if (mailToDisplay) {
      setSelectedMail(mailToDisplay);
    } else {
      console.warn(`Could not retrieve mail for bookmark ${bookmarkToOpen.id}`);
      setSelectedMail(null);
    }
  };

  if (isLoadingBookmarks || isMailsLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-w-fit h-screen overflow-x-auto" ref={containerRef}>
      <div
        className={`flex flex-col h-full transition-all duration-300 ease-in-out
          ${listVisible ? 'block' : 'hidden md:block'}
          ${mailFromContext ? 'md:w-[50%]' : 'w-full md:w-[calc(100%-1px)]'}`}
        style={{ width: mailFromContext && !isMobile ? `${100 - readerWidth}%` : '100%' }}
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

      {/* --- THIS IS THE FIX --- */}
      {/* Use the logical AND (&&) for proper conditional rendering */}
      {(
        <MailReader
          containerRef={containerRef}
          mailReaderWidth={readerWidth}
          setMailReaderWidth={setReaderWidth}
          onBack={() => {
            setSelectedBookmarkInList(null);
            setSelectedMail(null);
          }}
          mail={mailFromContext}
        />
      )}
    </div>
  );
};

export default BookmarkPage;