"use client";
import { motion } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import Inbox from "./Inbox";
import { useAuth } from "@/context/authContext";

const Sidebar = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const [width, setWidth] = useState(320); // Default width in pixels
  const sidebarRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const MIN_WIDTH = 240; // Minimum width in pixels
  const MAX_WIDTH = 480; // Maximum width in pixels

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) return;

    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    let newWidth = e.clientX;

    if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
    if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;

    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  // Clean up event listeners if component unmounts while dragging
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      className="h-screen bg-sidebar flex flex-col shadow-sm relative"
      style={{ width: `${width}px` }}
    >

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-[2px]">
        {/* Inbox - Focus solely on the inbox content */}
        <Inbox />
      </div>

      <div
        className={`absolute top-0 right-[-2px] w-[2px] h-full bg-border/80 hover:bg-primary/30 cursor-col-resize transform translate-x-0 ${window.innerWidth < 768 ? 'hidden' : ''
          }`}
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
    </div>
  );
};

export default Sidebar;