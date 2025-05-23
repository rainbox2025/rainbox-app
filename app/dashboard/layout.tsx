"use client";
import Sidebar from "@/components/sidebar/Sidebar";
import React, { useEffect, useState, useRef } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Menu, X } from "lucide-react";
import LeftPanel from "@/components/left-panel";

const layout = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = await createClient();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Auth timeout"));
          }, 5000);
        });

        const { data: user } = (await Promise.race([
          supabase.auth.getUser(),
          timeoutPromise,
        ])) as { data: any };

        if (!user) {
          redirect("/sign-in");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        redirect("/sign-in");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-3 left-4 z-50 md:hidden bg-content shadow-md"
          >
            {isSidebarOpen ? <X className="w-0 h-0" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Sidebar */}
          <div
            ref={sidebarRef}
            className={`absolute md:relative flex z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              } transition-transform duration-300 ease-in-out w-[80%] md:w-auto h-full`}
          >
            <LeftPanel />
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>

          {/* Overlay for mobile */}
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

export default layout;