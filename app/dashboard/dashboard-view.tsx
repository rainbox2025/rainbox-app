"use client";
import { useMails } from "@/context/mailsContext";
import React, { useEffect, useState, useRef } from "react";
import { Mail } from "@/types/data";
import { MailItemSkeleton } from "@/components/mails-loader";
import { SenderHeader } from "@/components/sender/sender-header";
import { MailItem } from "@/components/mails/mail-item";
import MailReader from "@/components/mails/mail-reader";
import { InboxIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const Page = () => {
  const [filter, setFilter] = useState("all");
  const { mails, selectedMail, setSelectedMail, isMailsLoading, isFetchingMore, loadMoreMails } = useMails();
  const [filteredMails, setFilteredMails] = useState<Mail[]>(mails);
  const [mailReaderWidth, setMailReaderWidth] = useState(60);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mailListVisible, setMailListVisible] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    // FIX: Ensure the mail reader is closed when the page loads or is refreshed.
    setSelectedMail(null);
  }, [setSelectedMail]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile) setMailListVisible(!selectedMail);
      else setMailListVisible(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedMail]);

  useEffect(() => {
    if (!selectedMail) setMailListVisible(true);
  }, [selectedMail]);

  useEffect(() => {
    const filtered = mails.filter((mail) => {
      if (filter === "all") return true;
      if (filter === "unread") return !mail.read;
      if (filter === "bookmarked") return mail.bookmarked;
      return true;
    });
    setFilteredMails(filtered);
  }, [filter, mails]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleScroll = () => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 300) {
        loadMoreMails();
      }
    };
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [loadMoreMails]);

  const unreadCount = mails.filter((mail) => !mail.read).length;

  return (
    <div className="flex w-full h-screen overflow-x-auto" ref={containerRef}>
      <div
        className={cn(
          "flex flex-col h-full",
          !isResizing && "transition-all duration-300 ease-in-out",
          mailListVisible ? "block" : "hidden",
          selectedMail ? "md:hidden lg:block lg:w-[50%]" : "w-full",
        )}
        style={{
          width: selectedMail && window.innerWidth >= 1024 ? `${100 - mailReaderWidth}%` : (mailListVisible && !selectedMail ? '100%' : undefined),
        }}
      >
        <SenderHeader
          filter={filter}
          setFilter={setFilter}
          unreadCount={unreadCount}
        />
        <div
          ref={scrollContainerRef}
          className="flex-grow overflow-y-auto custom-scrollbar"
          style={{ height: "calc(100vh - 64px)" }}
        >
          {isMailsLoading ? (
            <div className="flex flex-col">
              {Array(6).fill(0).map((_, i) => <MailItemSkeleton key={i} />)}
            </div>
          ) : filteredMails.length > 0 ? (
            <>
              {filteredMails.map((mail) => <MailItem key={mail.id} mail={mail} />)}
              {isFetchingMore && <MailItemSkeleton />}
            </>
          ) : (
            <div className="mt-50 flex flex-col items-center justify-center h-full py-12 space-y-4 text-muted-foreground">
              <div className="rounded-full bg-muted p-sm w-16 h-16 flex items-center justify-center">
                <InboxIcon className="w-8 h-8" />
              </div>
              <p className="text-sm">No emails found</p>
            </div>
          )}
        </div>
      </div>
      {selectedMail && (
        <MailReader
          containerRef={containerRef}
          mailReaderWidth={mailReaderWidth}
          setMailReaderWidth={setMailReaderWidth}
          onBack={() => setMailListVisible(true)}
          mail={selectedMail}
          isResizing={isResizing}
          setIsResizing={setIsResizing}
        />
      )}
    </div>
  );
};

export default Page;