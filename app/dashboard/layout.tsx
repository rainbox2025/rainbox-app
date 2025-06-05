"use client";
import Sidebar from "@/components/sidebar";
import React, { useEffect, useState, useRef } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Menu, X } from "lucide-react";
import LeftPanel from "@/components/left-panel";
import Inbox from "@/components/sidebar/Inbox"; // Make sure path is correct

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  // Renamed for clarity
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarContainerRef = useRef<HTMLDivElement>(null); // Renamed to avoid conflict if sidebarRef is used inside Sidebar

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser(); // Simpler destructuring
        if (!user) {
          redirect("/auth");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        redirect("/auth");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarContainerRef.current &&
        !sidebarContainerRef.current.contains(event.target as Node) &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  return (
    <main className="flex justify-start w-full items-start h-screen overflow-y-hidden relative">
      {loading ? (
        <div className="flex justify-center w-full items-center h-screen flex-col gap-4">
          <Loader2 className="animate-spin" />
          <h1>Loading...</h1>
        </div>
      ) : (
        <>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-3 left-4 z-50 md:hidden bg-content shadow-md p-1 rounded"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div
            ref={sidebarContainerRef} // Use the renamed ref here
            className={`absolute md:relative flex z-40 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} transition-transform duration-300 ease-in-out w-[80%] md:w-auto h-full bg-background md:bg-transparent`}
          >
            <LeftPanel />
            <Sidebar
              onClose={
                isSidebarOpen ? () => setIsSidebarOpen(false) : undefined
              }
            >
              <Inbox />
            </Sidebar>
          </div>

          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className="flex-1 w-full md:w-auto overflow-x-auto">
            {children}
          </div>
        </>
      )}
    </main>
  );
};

export default DashboardLayout;
