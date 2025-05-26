"use client";
import React, { useEffect, useState, useRef } from "react";
import { useBookmarks, Bookmark as BookmarkType } from "@/context/bookmarkContext";
import { BookmarkedItemsList } from "@/components/bookmark/bookmarked-item-list";
import { BookmarkedItemReader } from "@/components/bookmark/bookmarked-item-reader";
import { Loader2 } from "lucide-react";
import { BookOpenIcon as OutlineBookOpenIcon } from "@heroicons/react/24/outline";

const BookmarkPage = () => {
  const { bookmarks, isLoading: isLoadingBookmarks } = useBookmarks(); // Assuming context provides loading state
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkType | null>(null);

  const [readerWidth, setReaderWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [listVisible, setListVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setListVisible(!selectedBookmark);
      else setListVisible(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedBookmark]);

  useEffect(() => {
    if (!selectedBookmark) setListVisible(true);
    else if (isMobile) setListVisible(false);
  }, [selectedBookmark, isMobile]);

  const [filteredBookmarks, setFilteredBookmarks] = useState<BookmarkType[]>(bookmarks);
  useEffect(() => { setFilteredBookmarks(bookmarks); }, [bookmarks]);

  if (isLoadingBookmarks) { // Use loading state from context if available
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
        ${selectedBookmark ? 'md:w-[50%]' : 'w-full md:w-[calc(100%-1px)]'}`} // 1px for potential resizer
        style={{ width: selectedBookmark && window.innerWidth >= 768 ? `${100 - readerWidth}%` : '100%' }}
      >
        <div className="flex-grow overflow-y-auto custom-scrollbar" style={{ height: "100vh" }}>
          {filteredBookmarks.length > 0 ? (
            <BookmarkedItemsList
              bookmarks={filteredBookmarks}
              selectedBookmark={selectedBookmark}
              onSelectBookmark={(bm) => {
                setSelectedBookmark(bm);
                if (isMobile) setListVisible(false);
              }}
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

      {selectedBookmark && (
        <BookmarkedItemReader
          bookmark={selectedBookmark}
          onClose={() => setSelectedBookmark(null)}
          containerRef={containerRef}
          readerWidth={readerWidth}
          setReaderWidth={setReaderWidth}
          onBack={() => { setSelectedBookmark(null); setListVisible(true); }}
        />
      )}
    </div>
  );
};
export default BookmarkPage;