import Sidebar from "@/components/sidebar/Sidebar";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex justify-start w-full items-start">
      <Sidebar />
      {children}
    </main>
  );
};

export default layout;
