"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkIcon as HeroBookmarkIcon, // Renamed to avoid conflict
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
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useMode } from "@/context/modeContext";
import { useSenders } from "@/context/sendersContext";
import { useMails } from "@/context/mailsContext";
import { useAuth } from "@/context/authContext";
import { useTheme } from "next-themes";
import Image from "next/image";
import SettingsModal from "./settings/settings-modal";
import { InboxIcon, PlusIcon } from "lucide-react"; // Lucide InboxIcon
import { FeedbackModal } from "./feedback-modal";
import { AddNewsletterFlow } from "./newsletter/flow";
import { cn } from "@/lib/utils"; // Ensure you have cn utility
import { GmailConnection } from "./GmailConnection";
import { GmailOnboarding } from "./GmailOnboarding";

// Define an active class name or use Tailwind's group/peer for active state
const activeClass = "bg-hovered  "; // Example active style

export default function LeftPanel() {
  const { setMode } = useMode(); // This might be redundant if Link handles navigation
  const { setSelectedSender } = useSenders();
  const { setSelectedMail } = useMails();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const [isAddNewsletterFlowOpen, setIsAddNewsletterFlowOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showInfoMessage, setShowInfoMessage] = useState(false);

  const userModalRef = useRef<HTMLDivElement>(null);
  const emailModalRef = useRef<HTMLDivElement>(null);
  const themeModalRef = useRef<HTMLDivElement>(null);

  // Reset states when changing main sections
  const handleSectionChange = () => {
    setSelectedSender(null);
    setSelectedMail(null);
    // setMode(newMode); // setMode might be for sub-navigation within a section
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showUserModal &&
        userModalRef.current &&
        !userModalRef.current.contains(event.target as Node)
      ) {
        setShowUserModal(false);
      }
      if (
        showEmailModal &&
        emailModalRef.current &&
        !emailModalRef.current.contains(event.target as Node)
      ) {
        setShowEmailModal(false);
      }
      if (
        showThemeModal &&
        themeModalRef.current &&
        !themeModalRef.current.contains(event.target as Node)
      ) {
        setShowThemeModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserModal, showEmailModal, showThemeModal]);

  const toggleUserModal = () => setShowUserModal((prev) => !prev);
  const toggleEmailModal = () => setShowEmailModal((prev) => !prev);
  const toggleThemeModal = () => setShowThemeModal((prev) => !prev);

  return (
    <>
      <div className="h-full w-12 bg-content flex flex-col items-center border-r border-border py-3 gap-2">
        <div className="mb-2">
          <Image
            src="/RainboxLogo.png"
            alt="Logo"
            className="w-8 h-8"
            width={32}
            height={32}
          />
        </div>

        <Link href="/dashboard" passHref>
          <button
            onClick={handleSectionChange}
            className={cn(
              "p-xs rounded-sm hover:bg-hover transition-colors text-muted-foreground hover:text-foreground",
              (pathname === "/dashboard" ||
                pathname.startsWith("/dashboard/")) &&
                activeClass
            )}
            title="Inbox"
          >
            <InboxIcon className="w-5 h-5 stroke-[1.5]" />
          </button>
        </Link>

        <Link href="/bookmark" passHref>
          <button
            onClick={handleSectionChange}
            className={cn(
              "p-xs rounded-sm hover:bg-hover transition-colors text-muted-foreground hover:text-foreground",
              (pathname === "/bookmark" || pathname.startsWith("/bookmark/")) &&
                activeClass
            )}
            title="Bookmarks"
          >
            <HeroBookmarkIcon className="w-5 h-5" />
          </button>
        </Link>

        {/* Discover Button - Assuming it navigates somewhere or sets a mode */}
        {/* <Link href="/discover" passHref> */}
        <button
          onClick={() => setIsAddNewsletterFlowOpen(true)}
          className={cn(
            "p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
            // pathname.startsWith("/discover") && activeClass // Example if /discover is a page
          )}
          title="Discover"
        >
          <SquaresPlusIcon className="w-5 h-5" />
        </button>
        {/* </Link> */}

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
                    className={`flex items-center gap-md p-xs rounded hover:bg-hover ${
                      theme === "light"
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
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
                    className={`flex items-center gap-md p-xs rounded hover:bg-hover ${
                      theme === "dark"
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
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
                    className={`flex items-center gap-md p-xs rounded hover:bg-hover ${
                      theme === "system"
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
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

        <button
          className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
          onClick={() => setIsSettingsOpen(true)}
          title="Settings"
        >
          <Cog8ToothIcon className="w-5 h-5" />
        </button>

        <button
          className="p-xs rounded-lg hover:bg-hover transition-colors text-muted-foreground hover:text-foreground"
          title="Feedback"
          onClick={() => setIsFeedbackOpen(true)}
        >
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
        </button>

        <div className="relative mb-2" ref={userModalRef}>
          <button
            className="p-1 rounded-full hover:bg-hover transition-colors"
            onClick={toggleUserModal}
            title="Account"
          >
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt="Avatar"
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <UserCircleIcon className="w-6 h-6 text-muted-foreground" />
            )}
          </button>
          {showUserModal && (
            <div className="absolute left-14 bottom-0 bg-content text-popover-foreground rounded-lg shadow-xl p-3 w-40 z-50">
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

                <div className="text-center w-full break-words">
                  <h2 className="text-sm font-semibold break-words">
                    {user?.user_name || "User Profile"}
                  </h2>
                  <p className="text-xs text-muted-foreground break-words">
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
      {/* <GmailConnection /> */}
    </>
  );
}
