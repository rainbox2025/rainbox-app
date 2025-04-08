"use client";
import Sidebar from "@/components/sidebar/Sidebar";
import React, { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

const layout = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);

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
  }, []);

  return (
    <main className="flex justify-start w-full items-start">
      {loading ? (
        <div className="flex justify-center w-full items-center h-screen flex-col gap-4">
          <Loader2 className="animate-spin" />
          <h1>Loading...</h1>
        </div>
      ) : (
        <>
          <Sidebar />
          {children}
        </>
      )}
    </main>
  );
};

export default layout;
