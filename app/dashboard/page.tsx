"use client";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal"; // Corrected path
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
  // Get isOnboardingCompleted directly from the context.
  // The context is responsible for determining this value after its loading phase.
  const { isOnboardingCompleted, resetOnboardingProgress } = useOnboarding(); // Added reset for testing

  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const { mails, selectedMail, isMailsLoading } = useMails();
  // const { mode } = useMode(); // Assuming useMode is defined elsewhere
  const { selectedSender, setSelectedSender } = useSenders();
  const [filteredMails, setFilteredMails] = useState<Mail[]>(mails);

  // The decision to show the modal is now directly tied to the context's state.
  // No separate showOnboardingModal state needed here for this specific logic.
  // The OnboardingModal itself can use `isOnboardingCompleted` to decide if it should be open.

  const [mailReaderWidth, setMailReaderWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mailListVisible, setMailListVisible] = useState(true);
  // const [isMobile, setIsMobile] = useState(false); // isMobile can be derived inside useEffect

  // This useEffect determines if the modal should be shown.
  // It relies purely on the isOnboardingCompleted state from the context.
  // The OnboardingModal component itself will handle its 'open' state based on this.
  // useEffect(() => {
  //   // No need to call checkIfPreviouslyCompleted here.
  //   // The context handles establishing the correct isOnboardingCompleted state.
  //   if (!isOnboardingCompleted) {
  //     // If not completed, the <OnboardingModal /> component will render itself open.
  //   } else {
  //     // If completed, the <OnboardingModal /> component will render itself closed (or null).
  //   }
  // }, [isOnboardingCompleted]);
  // The above useEffect is actually redundant if OnboardingModal handles its own visibility correctly.

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      // setIsMobile(mobile); // Not strictly needed as state if only used here

      if (mobile) {
        setMailListVisible(!selectedMail);
      } else {
        setMailListVisible(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedMail]);

  useEffect(() => {
    if (!selectedMail) {
      setMailListVisible(true);
    }
  }, [selectedMail]);

  useEffect(() => {
    setUnreadCount(mails.filter((mail) => !mail.read).length);
    const currentFilteredMails = mails.filter((mail) => {
      if (filter === "all") return true;
      if (filter === "unread") return !mail.read;
      if (filter === "read") return mail.read;
      return true; // Default case
    });
    setFilteredMails(currentFilteredMails);
  }, [filter, mails]);


  return (
    <div
      className="flex min-w-fit h-screen overflow-x-auto"
      ref={containerRef}
    >
      {/* 
        The OnboardingModal component should internally check `isOnboardingCompleted`.
        If it's false, it renders and is open. If true, it renders null or is closed.
      */}
      <OnboardingModal />
      {/* For testing:
        <button onClick={resetOnboardingProgress} className="absolute top-0 right-0 z-50 p-2 bg-red-500 text-white">
          Reset Onboarding
        </button>
      */}

      <div
        className={`flex flex-col h-full transition-all duration-300 ease-in-out 
        ${mailListVisible ? 'block' : 'hidden md:block'} 
        ${selectedMail && typeof window !== 'undefined' && window.innerWidth >= 768 ? `w-[${100 - mailReaderWidth}%]` : 'w-full'}`}
      // Dynamic width for desktop when mail is selected
      // style={ selectedMail && typeof window !== 'undefined' && window.innerWidth >= 768 ? { width: `${100 - mailReaderWidth}%` } : { width: "100%" }}
      >
        <SenderHeader
          filter={filter}
          setFilter={setFilter}
          unreadCount={unreadCount}
        />

        <div className="flex-grow overflow-y-auto custom-scrollbar" style={{ height: "calc(100vh - 64px)" }}>
          {isMailsLoading ? (
            <div className="flex flex-col">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <MailItemSkeleton key={i} />
                ))}
            </div>
          ) : filteredMails.length > 0 ? (
            filteredMails.map((mail) => (
              <MailItem key={mail.id} mail={mail} />
            ))
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