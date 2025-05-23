"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  BookmarkIcon,
  SquaresPlusIcon,
  Cog8ToothIcon,
  UserCircleIcon,
  AtSymbolIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useMode } from "@/context/modeContext";
import { useSenders } from "@/context/sendersContext";
import { useMails } from "@/context/mailsContext";
import { useAuth } from "@/context/authContext";
import { useTheme } from "next-themes";
import Image from "next/image";
import SettingsModal from "./SettingsModal";
import { InboxIcon, PlusIcon } from "lucide-react";
import { FeedbackModal } from "../feedback-modal";
import { AddNewsletterFlow } from "../newsletter/flow";

export default function LeftPanel() {
  const { setMode } = useMode();
  const { setSelectedSender } = useSenders();
  const { setSelectedMail } = useMails();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // State for modals
  const [isAddNewsletterFlowOpen, setIsAddNewsletterFlowOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showInfoMessage, setShowInfoMessage] = useState(false);

  // Refs for modal containers
  const userModalRef = useRef<HTMLDivElement>(null);
  const emailModalRef = useRef<HTMLDivElement>(null);
  const themeModalRef = useRef<HTMLDivElement>(null);

  const handleNavigationClick = (newMode: "bookmarks" | "discover") => {
    setMode(newMode);
    setSelectedSender(null);
    setSelectedMail(null);
  };

  const handleCopyEmail = () => {
    if (
      user?.email &&
      typeof navigator !== "undefined" &&
      navigator.clipboard
    ) {
      navigator.clipboard.writeText(user.email);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 1000);
    }
  };

  // Click outside handler to close modals
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if click was outside user modal
      if (showUserModal &&
        userModalRef.current &&
        !userModalRef.current.contains(event.target as Node)) {
        setShowUserModal(false);
      }

      // Check if click was outside email modal
      if (showEmailModal &&
        emailModalRef.current &&
        !emailModalRef.current.contains(event.target as Node)) {
        setShowEmailModal(false);
      }

      // Check if click was outside theme modal
      if (showThemeModal &&
        themeModalRef.current &&
        !themeModalRef.current.contains(event.target as Node)) {
        setShowThemeModal(false);
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Remove event listener on cleanup
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserModal, showEmailModal, showThemeModal]);

  // Toggle functions for modals
  const toggleUserModal = () => {
    setShowUserModal(!showUserModal);
    setShowEmailModal(false);
    setShowThemeModal(false);
  };

  const toggleEmailModal = () => {
    setShowEmailModal(!showEmailModal);
    setShowUserModal(false);
    setShowThemeModal(false);
  };

  const toggleThemeModal = () => {
    setShowThemeModal(!showThemeModal);
    setShowUserModal(false);
    setShowEmailModal(false);
  };

  return (
    <>
      <div className="h-full w-12 bg-content flex flex-col items-center border-r border-border py-3 gap-2">
        {/* Logo */}
        <div className="mb-2">
          <Image
            src="/RainboxLogo.png"
            alt="Logo"
            className="w-8 h-8"
            width={32}
            height={32}
          />
        </div>

        {/* Navigation Icons */}
        <button
          onClick={() => handleNavigationClick("bookmarks")}
          className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
          title="Inbox"
        >
          <InboxIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleNavigationClick("bookmarks")}
          className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
          title="Bookmarks"
        >
          <BookmarkIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleNavigationClick("discover")}
          className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
          title="Discover"
        >
          <SquaresPlusIcon className="w-5 h-5" />
        </button>

        <button
          className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
          title="Search"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>

        <button
          className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
          title="Add New"
          onClick={() => setIsAddNewsletterFlowOpen(true)}
        >
          <PlusIcon className="w-5 h-5" strokeWidth={1.8} />
        </button>



        <div className="flex-grow"></div>

        {/* Email Info - Click to open */}
        <div className="relative" ref={emailModalRef}>
          <button
            onClick={toggleEmailModal}
            className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
            title={"Email address"}
          >
            <AtSymbolIcon className="w-5 h-5" />
          </button>

          {showEmailModal && (
            <div className="absolute left-14 bottom-0 z-40">
              <div className="bg-content p-sm rounded-lg shadow-md flex items-center gap-xs w-60">
                <span className="text-xs text-muted-foreground truncate flex-grow">
                  {user?.email || "Not logged in"}
                </span>

                <button
                  className="text-muted-foreground hover:text-foreground rounded-full hover:bg-hover relative p-xs"
                  onMouseEnter={() => setShowInfoMessage(true)}
                  onMouseLeave={() => setShowInfoMessage(false)}
                >
                  <InformationCircleIcon className="w-4 h-4" />
                  {showInfoMessage && (
                    <motion.div
                      className="absolute right-1 top-10 mb-2 bg-content text-popover-foreground px-2 py-1 rounded text-xs shadow-md z-10 w-40"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {`You are currently on the free plan. Upgrade anytime for more benefits!`}
                    </motion.div>
                  )}
                </button>

                <button
                  className="text-muted-foreground hover:text-foreground rounded-full hover:bg-hover cursor-pointer relative p-1"
                  onClick={handleCopyEmail}
                  title="Copy email to clipboard"
                  disabled={!user?.email}
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  {showCopiedMessage && (
                    <motion.div
                      className="absolute right-0 top-full mt-2 bg-content text-popover-foreground px-2 py-1 rounded text-xs shadow-md z-10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      Copied!
                    </motion.div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher - Click to open */}
        <div className="relative" ref={themeModalRef}>
          <button
            onClick={toggleThemeModal}
            className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
            title="Appearance"
          >
            {theme === "dark" ? (
              <MoonIcon className="w-5 h-5" />
            ) : theme === "light" ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <ComputerDesktopIcon className="w-5 h-5" />
            )}
          </button>

          {showThemeModal && (
            <div className="absolute left-14 bottom-0 z-40">
              <div className="bg-content rounded-lg shadow-md p-xs">
                <div className="flex flex-col gap-xs w-32">
                  <button
                    onClick={() => {
                      setTheme("light");
                      setShowThemeModal(false);
                    }}
                    className={`flex items-center gap-md p-xs rounded hover:bg-hover ${theme === "light" ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                  >
                    <SunIcon className="w-4 h-4" />
                    <span className="text-xs">Light</span>
                  </button>

                  <button
                    onClick={() => {
                      setTheme("dark");
                      setShowThemeModal(false);
                    }}
                    className={`flex items-center gap-md p-xs rounded hover:bg-hover ${theme === "dark" ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                  >
                    <MoonIcon className="w-4 h-4" />
                    <span className="text-xs">Dark</span>
                  </button>

                  <button
                    onClick={() => {
                      setTheme("system");
                      setShowThemeModal(false);
                    }}
                    className={`flex items-center gap-md p-xs rounded hover:bg-hover ${theme === "system" ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                  >
                    <ComputerDesktopIcon className="w-4 h-4" />
                    <span className="text-xs">System</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button
          className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Settings"
          onClick={() => setIsSettingsOpen(true)}
          title="Settings"
        >
          <Cog8ToothIcon className="w-5 h-5" />
        </button>

        {/* Feedback */}
        <button
          className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Feedback"
          title="Feedback"
          onClick={() => setIsFeedbackOpen(true)}
        >
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
        </button>


        {/* User Profile - Click to open */}
        <div className="relative mb-2" ref={userModalRef}>
          <button
            className="p-1 rounded-full hover:bg-hover transition-colors"
            onClick={toggleUserModal}
            title="Account"
          >
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt="User Avatar"
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <UserCircleIcon className="w-6 h-6 text-muted-foreground" />
            )}
          </button>

          {showUserModal && (
            <div
              className="absolute left-14 bottom-0 bg-content text-popover-foreground rounded-lg shadow-xl p-3 w-40 z-50"
            >
              <div className="flex flex-col items-center space-y-2">
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt="User Avatar"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="w-12 h-12 text-muted-foreground" />
                )}

                <div className="text-center">
                  <h2 className="text-sm font-semibold">
                    {user?.user_name || "User Profile"}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate max-w-full">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={logout}
                  className="w-full bg-destructive text-destructive-foreground rounded-md py-1 text-xs hover:bg-destructive/90 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFeedbackOpen && (
        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AddNewsletterFlow
        isOpen={isAddNewsletterFlowOpen}
        onClose={() => setIsAddNewsletterFlowOpen(false)}
      />
    </>
  );
}