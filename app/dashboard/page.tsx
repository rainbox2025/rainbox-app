"use client";
import { OnboardingModal } from "@/components/onboardingmodal";
import { useOnboarding } from "@/context/onboardingContext";
import { useMails } from "@/context/mailsContext";
import { useSenders } from "@/context/sendersContext";
import React, { useEffect, useState, useRef } from "react";
import { Mail } from "@/types/data";
import { MailItemSkeleton } from "@/components/mails-loader";
import { SenderHeader } from "@/components/sender/sender-header";
import { MailItem } from "@/components/mails/mail-item";
import MailReader from "@/components/mails/mail-reader";
import { useMode } from "@/context/modeContext";
import { InboxIcon } from "@heroicons/react/24/outline";

const Page = () => {
  const { isOnboardingComplete } = useOnboarding();
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const { mails, selectedMail, isMailsLoading } = useMails();
  const { mode } = useMode();
  const { selectedSender, setSelectedSender } = useSenders();
  const [filteredMails, setFilteredMails] = useState<Mail[]>(mails);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [mailReaderWidth, setMailReaderWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mailListVisible, setMailListVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const isOnboardingCompletes = await isOnboardingComplete();
      if (!isOnboardingCompletes) {
        setShowOnboardingModal(true);
      }
    };
    checkOnboarding();
  }, [isOnboardingComplete]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile) {
        // On mobile, hide mail list when mail is selected
        setMailListVisible(!selectedMail);
      } else {
        // Always show mail list on desktop
        setMailListVisible(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [selectedMail]);

  useEffect(() => {
    if (!selectedMail) {
      setMailListVisible(true);
    }
  }, [selectedMail]);

  useEffect(() => {
    setUnreadCount(mails.filter((mail) => !mail.read).length);
    const filteredMails = mails.filter((mail) => {
      if (filter === "all") return true;
      if (filter === "unread") return !mail.read;
      if (filter === "bookmarked") return mail.bookmarked;
    });
    setFilteredMails(filteredMails);
  }, [filter, mails]);

  return (
    <div className="flex min-w-fit h-screen overflow-x-auto" ref={containerRef}>
      {showOnboardingModal && <OnboardingModal />}

      <div
        className={`flex flex-col h-full transition-all duration-300 ease-in-out 
        ${mailListVisible ? "block" : "hidden md:block"} 
        ${selectedMail ? "md:w-[50%]" : "w-full"}`}
        style={{
          width:
            selectedMail && window.innerWidth >= 768
              ? `${100 - mailReaderWidth}%`
              : "100%",
        }}
      >
        <SenderHeader
          filter={filter}
          setFilter={setFilter}
          unreadCount={unreadCount}
        />

        <div
          className="flex-grow overflow-y-auto custom-scrollbar"
          style={{ height: "calc(100vh - 64px)" }}
        >
          {isMailsLoading ? (
            <div className="flex flex-col">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <MailItemSkeleton key={i} />
                ))}
            </div>
          ) : filteredMails.length > 0 ? (
            filteredMails.map((mail) => <MailItem key={mail.id} mail={mail} />)
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
        />
      )}
    </div>
  );
};

export default Page;
