"use client";
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect } from 'react';
import {
  Cog8ToothIcon,
  BookmarkIcon,
  UserCircleIcon,
  SquaresPlusIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { user } from '@/mock/data';
import Image from 'next/image';
import Inbox from './Inbox';

const Sidebar = () => {
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showInfoMessage, setShowInfoMessage] = useState(false);
  const [width, setWidth] = useState(320); // Default width in pixels
  const sidebarRef = useRef(null);
  const isDraggingRef = useRef(false);

  const MIN_WIDTH = 240; // Minimum width in pixels
  const MAX_WIDTH = 480; // Maximum width in pixels

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Add a class to the body to change cursor during resize
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection during resize
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    let newWidth = e.clientX;

    // Apply constraints
    if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
    if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;

    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    // Reset cursor and user-select
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Clean up event listeners if component unmounts while dragging
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      className="h-screen flex flex-col bg-background border-r border-border shadow-sm relative"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="px-md py-xs flex items-center justify-between border-b border-border">
        <div className="flex items-center space-x-md">
          <Image src="/RainboxLogo.png" alt="Logo" width={32} height={32} />
          <span className="font-bold text-xl tracking-tight text-foreground">Rainbox</span>
        </div>
        <div className="flex items-center space-x-md">
          <button
            className="text-muted-foreground hover:text-foreground rounded-full hover:bg-accent cursor-pointer transition-transform duration-300 ease-in-out hover:rotate-60"
            aria-label="Settings"
          >
            <Cog8ToothIcon className="w-5 h-5" />
          </button>
          <button
            className="text-blue-500 hover:text-blue-700 rounded-full hover:bg-accent cursor-pointer"
            aria-label="Account"
          >
            <UserCircleIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Email Info */}
        <div className="px-md py-sm pr-md flex items-center justify-between border-b border-border">
          <div className="flex items-center space-x-md overflow-hidden mr-md flex-shrink min-w-0">
            <span className="text-muted-foreground w-5 h-5 flex items-center justify-center flex-shrink-0">@</span>
            <span className="text-sm font-medium truncate text-foreground">{user.email}</span>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              className="text-muted-foreground hover:text-foreground rounded-full hover:bg-accent relative"
              onMouseEnter={() => setShowInfoMessage(true)}
              onMouseLeave={() => setShowInfoMessage(false)}
            >
              <InformationCircleIcon className="w-5 h-5 text-muted-foreground" />
              <AnimatePresence>
                {showInfoMessage && (
                  <motion.div
                    className="absolute left-0 -translate-x-1/2 top-full mt-md bg-popover text-popover-foreground px-md py-md-y rounded text-xs shadow-md z-10 w-40"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    This is your registered email address. It&apos;s used for account notifications and recovery.
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <button
              className="text-muted-foreground hover:text-foreground rounded-full hover:bg-accent cursor-pointer relative"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(user.email);
                  setShowCopiedMessage(true);
                  setTimeout(() => setShowCopiedMessage(false), 1000);
                }
              }}
              title="Copy email to clipboard"
            >
              <DocumentDuplicateIcon className="w-5 h-5" />
              <AnimatePresence>
                {showCopiedMessage && (
                  <motion.div
                    className="absolute right-0 top-full mt-md bg-popover text-popover-foreground px-md py-md-y rounded text-xs shadow-md z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-border">
          <nav className="">
            <a href="#" className="flex items-center space-x-md px-md py-sm hover:bg-accent rounded text-sm text-foreground">
              <SquaresPlusIcon className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Discover</span>
            </a>
            <a href="#" className="flex items-center space-x-md px-md py-sm hover:bg-accent rounded text-sm text-foreground">
              <BookmarkIcon className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Bookmarks</span>
            </a>
          </nav>
        </div>

        {/* Inbox */}
        <Inbox />
      </div>


      {/* Footer */}
      {/* <div className="px-md py-sm flex items-center justify-between border-t">
        <span className="text-sm font-medium text-muted-foreground">{user.usedFeeds}/{user.totalFeeds} Feeds (Free)</span>
        <button
          className="btn"
        >
          Upgrade
        </button>
      </div> */}

      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-[2px] h-full bg-muted-foreground hover:bg-primary cursor-ew-resize transform translate-x-0.5"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
    </div>
  );
};

export default Sidebar;