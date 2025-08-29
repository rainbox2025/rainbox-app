"use client";
import { FolderPlusIcon } from "@heroicons/react/24/outline";
import React, { useState, useRef, useEffect } from "react";
import { BasicModal } from "../modals/basic-modal";
import { useFolders } from "@/context/foldersContext";

const Sidebar = ({ children, onClose }: { children: React.ReactNode, onClose?: () => void }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false); // To manage dragging state reliably inside event listeners
  const MIN_WIDTH = 250;
  const MAX_WIDTH = 380;
  const LEFT_PANEL_WIDTH = 48; // Assuming LeftPanel is 48px (3rem). Adjust if different.
  const [width, setWidth] = useState(MIN_WIDTH); // Default width

  // New state to track if the view is mobile
  const [isMobileView, setIsMobileView] = useState(false);

  // Effect to check and update the mobile view state
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    // Check on initial component mount
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);

    // Cleanup listener when the component unmounts
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  const handleMouseDown = (e: React.MouseEvent) => {
    // Use the new state for the check
    if (isMobileView) return; // No resize on mobile

    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true); // For styling/cursor changes
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    // clientX is mouse position from left of viewport.
    // Sidebar width is this position minus the width of elements to its left (i.e., LeftPanel).
    let newWidth = e.clientX - LEFT_PANEL_WIDTH;

    if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
    if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;

    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    // Cleanup listeners if component unmounts while dragging
    return () => {
      if (isDraggingRef.current) { // Check if still dragging to remove
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  return (
    <div
      ref={sidebarRef}
      className="h-screen bg-sidebar flex flex-col shadow-sm relative"
      // Conditionally set the width style based on the view
      style={isMobileView ? { width: '80%' } : { width: `${width}px` }}
    >

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-[2px] pb-[130px]">
        {children}
      </div>
      <div
        // Use the new state to conditionally hide the resizer handle
        className={`absolute top-0 right-[-2px] w-[2px] h-full bg-border/80 hover:bg-primary/30 cursor-col-resize transform translate-x-0 ${isMobileView ? 'hidden' : ''}`}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />

    </div>
  );
};

export default Sidebar;