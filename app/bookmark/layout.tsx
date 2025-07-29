

"use client";
import Sidebar from "@/components/sidebar";
import React, { useEffect, useState, useRef } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import LeftPanel from "@/components/left-panel";
import BookmarkSidebarContent from "@/components/bookmark/bookmark-sidebar";
import { BookmarkProvider } from "@/context/bookmarkContext";

import { SidebarProvider, useSidebar } from "@/context/sidebarContext";



const BookmarkLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);

  const { isSidebarOpen, closeSidebar } = useSidebar();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarContainerRef.current &&
        !sidebarContainerRef.current.contains(event.target as Node) &&
        isSidebarOpen
      ) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen, closeSidebar]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          redirect("/auth");
        }
      } catch (error) {
        console.error("Error fetching user for bookmark layout:", error);
        redirect("/auth");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <BookmarkProvider>
      <main className="flex justify-start w-full items-start h-screen overflow-y-hidden relative">
        {loading ? (
          <div className="flex justify-center w-full items-center h-screen flex-col gap-4">
            <Loader2 className="animate-spin" />
            <h1>Loading...</h1>
          </div>
        ) : (
          <>
            <div
              ref={sidebarContainerRef}
              className={`absolute md:relative flex z-40 ${isSidebarOpen ? "translate-x-0" : "-translate-x-[105%] md:translate-x-0"} transition-transform duration-300 ease-in-out w-[80%] md:w-auto h-full bg-sidebar`}
            >
              <LeftPanel />
              <Sidebar onClose={isSidebarOpen ? closeSidebar : undefined}>
                <BookmarkSidebarContent />
              </Sidebar>
            </div>

            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/20 z-30 md:hidden"
                onClick={closeSidebar}
              />
            )}


            <div className="flex-1 w-full md:w-auto overflow-x-auto" onClick={(e) => {



            }}>
              {children}
            </div>
          </>
        )}
      </main>
    </BookmarkProvider>
  );
};


const BookmarkLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <BookmarkLayoutContent>{children}</BookmarkLayoutContent>
    </SidebarProvider>
  );
};

export default BookmarkLayout;