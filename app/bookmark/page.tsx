"use client";
import React, { useEffect, useState, useRef } from "react";
import { useBookmarks, Bookmark as BookmarkType } from "@/context/bookmarkContext";
import { BookmarkedItemsList } from "@/components/bookmark/bookmarked-item-list";
import { MailReader } from "@/components/mails/mail-reader"; // Ensure this path is correct
import { useMails } from "@/context/mailsContext";
import { Mail } from "@/types/data"; // Make sure this import points to your Mail type definition

import { Loader2, Menu, X } from "lucide-react";
import { BookOpenIcon as OutlineBookOpenIcon } from "@heroicons/react/24/outline";
import { useSidebar } from "@/context/sidebarContext";

const BookmarkPage = () => {
  const { bookmarks: allBookmarksFromContext, isLoading: isLoadingBookmarks } = useBookmarks();
  // 1. Destructure `mails` array and `isMailsLoading` from useMails()
  const { mails, setSelectedMail, selectedMail: mailFromContext, isMailsLoading } = useMails();

  // Local state for highlighting the selected bookmark in the BookmarkedItemsList
  const [selectedBookmarkInList, setSelectedBookmarkInList] = useState<BookmarkType | null>(null);
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  const [readerWidth, setReaderWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [listVisible, setListVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setListVisible(!mailFromContext); // Visibility depends on whether a mail is open in reader
      else setListVisible(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mailFromContext]);

  useEffect(() => {
    if (!mailFromContext) setListVisible(true);
    else if (isMobile) setListVisible(false);
  }, [mailFromContext, isMobile]);

  // Use allBookmarksFromContext directly or filter if needed
  // For simplicity, assuming we display all bookmarks from context here.
  // If you had search/filter for bookmarks on this page, you'd manage 'filteredBookmarks' state.
  const bookmarksToDisplay = allBookmarksFromContext;


  // Consider loading state from both contexts
  if (isLoadingBookmarks || isMailsLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  // 2. Corrected handler for selecting a bookmark
  const handleSelectBookmark = (bookmarkToOpen: BookmarkType) => {
    setSelectedBookmarkInList(bookmarkToOpen); // Update local state for list highlighting

    if (bookmarkToOpen.mailId) {
      // Find the full Mail object from the `mails` array using the bookmark's mailId
      const mailToDisplay = mails.find(mail => mail.id === bookmarkToOpen.mailId);

      if (mailToDisplay) {
        setSelectedMail(mailToDisplay); // Set the *actual Mail object* in MailsContext
      } else {
        // Mail not found in the current 'mails' list.
        // This could happen if 'mails' in MailsContext is filtered (e.g., by sender)
        // or if the mail was deleted.
        console.warn(`Mail with ID ${bookmarkToOpen.mailId} not found in current mails list for bookmark ${bookmarkToOpen.id}.`);
        setSelectedMail(null); // Clear selection or show an error message
      }
    } else {
      console.warn(`Bookmark ${bookmarkToOpen.id} does not have a mailId. Cannot open in MailReader.`);
      setSelectedMail(null); // No mail to open
    }

    if (isMobile) {
      setListVisible(false); // Hide list on mobile when an item is selected
    }
  };

  return (
    <div className="flex min-w-fit h-screen overflow-x-auto" ref={containerRef}>
      <div
        className={`flex flex-col h-full transition-all duration-300 ease-in-out
        ${listVisible ? 'block' : 'hidden md:block'}
        ${mailFromContext ? 'md:w-[50%]' : 'w-full md:w-[calc(100%-1px)]'}`}
        style={{ width: mailFromContext && window.innerWidth >= 768 ? `${100 - readerWidth}%` : '100%' }}
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
          <h1
            className={`font-semibold text-md truncate text-muted-foreground ml-2`}
          >
            Bookmarks
          </h1>
        </div>
        <div className="flex-grow overflow-y-auto custom-scrollbar" style={{ height: "98vh" }}>
          {bookmarksToDisplay.length > 0 ? (
            <BookmarkedItemsList
              bookmarks={bookmarksToDisplay}
              selectedBookmark={selectedBookmarkInList} // Pass the local state for highlighting
              onSelectBookmark={handleSelectBookmark}  // Use the corrected handler
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

      {/* MailReader renders if mailFromContext (the actual Mail object) is set */}
      {mailFromContext && (
        <MailReader
          containerRef={containerRef}
          mailReaderWidth={readerWidth}
          setMailReaderWidth={setReaderWidth}
          onBack={() => {
            setSelectedBookmarkInList(null); // Clear local list highlight
            setSelectedMail(null);          // Clear mail in MailsContext
            setListVisible(true);           // Show list again
          }}
        />
      )}
    </div>
  );
};
export default BookmarkPage;