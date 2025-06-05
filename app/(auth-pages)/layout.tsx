// app/(auth-pages)/layout.tsx
"use client";
// Remove import "./auth.css"; if styles are fully handled by Tailwind in page.tsx
// or keep it if it contains global styles you still need for the auth section.
// For this example, assuming Tailwind is sufficient for the new page.
import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    // The Figma design is a single centered card, so complex layout might not be needed here.
    // This layout centers content.
    <div className="flex flex-col items-center justify-center min-h-screen bg-content">
      {children}
    </div>
  );
}

export default AuthLayout;