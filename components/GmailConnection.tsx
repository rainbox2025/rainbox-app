"use client";

import { useGmail } from "../context/gmailContext";
import { Loader2, Mail, XCircle, LogOut } from "lucide-react";
import { GmailOnboarding } from "./GmailOnboarding";

const Button = ({ children, className, ...props }: React.ComponentProps<'button'>) => (
  <button {...props} className={`inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
    {children}
  </button>
);

export const GmailConnection = () => {
  const { isConnected, email, isLoading, error, connectGmail, disconnectGmail } = useGmail();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 border rounded-lg bg-zinc-50 text-zinc-500">
        <Loader2 className="animate-spin mr-2" />
        Checking Gmail Connection...
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="p-4 border rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {isConnected ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <Mail />
                </div>
                <div>
                  <p className="font-semibold text-zinc-800">Gmail Connected</p>
                  <p className="text-sm text-zinc-500">{email}</p>
                </div>
              </div>
              <Button onClick={disconnectGmail} disabled={isLoading} className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                <LogOut size={16} /> Disconnect
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-zinc-100 text-zinc-500 rounded-full flex items-center justify-center">
                  <XCircle />
                </div>
                <div>
                  <p className="font-semibold text-zinc-800">Gmail Not Connected</p>
                  <p className="text-sm text-zinc-500">Connect to manage senders.</p>
                </div>
              </div>
              <Button onClick={connectGmail} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Mail size={16} /> Connect Gmail
              </Button>
            </>
          )}
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>
      <GmailOnboarding />
    </div>


  );
};