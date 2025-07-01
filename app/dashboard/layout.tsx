"use client";

import Sidebar from "@/components/sidebar";
import React, { useEffect, useRef, useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import LeftPanel from "@/components/left-panel";
import Inbox from "@/components/sidebar/Inbox";
import { useSidebar } from "@/context/sidebarContext";
import { OnboardingFlow } from "@/components/onboarding/flow"; // <-- IMPORT THE FLOW

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);
  const { isSidebarOpen, closeSidebar } = useSidebar();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
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
  }, []);

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

  return (
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
            className={`absolute md:relative flex z-40 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} transition-transform duration-300 ease-in-out w-[80%] md:w-auto h-full bg-background md:bg-transparent`}
          >
            <LeftPanel />
            <Sidebar onClose={isSidebarOpen ? closeSidebar : undefined}>
              <Inbox />
            </Sidebar>
          </div>

          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 z-30 md:hidden"
              onClick={closeSidebar}
            />
          )}

          <div className="flex-1 w-full md:w-auto overflow-x-auto">
            {children}
          </div>

          {/* RENDER THE ONBOARDING FLOW HERE */}
          {/* It's a sibling to the main content, allowing it to render on top as a modal */}
          <OnboardingFlow />
        </>
      )}
    </main>
  );
};

export default DashboardLayout;