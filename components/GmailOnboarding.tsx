"use client";

import { useGmail, Sender, OnboardingResult } from "../context/gmailContext";
import { useCallback, useEffect, useState } from "react";
import { Search, Loader2, User, Check, AlertTriangle, PartyPopper } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

// Reusable UI bits
const Input = (props: React.ComponentProps<'input'>) => (
  <input {...props} className="w-full px-4 py-2 border border-zinc-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
);
const Button = ({ children, className, ...props }: React.ComponentProps<'button'>) => (
  <button {...props} className={`inline-flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
    {children}
  </button>
);
const Spinner = () => <Loader2 className="animate-spin" />;

export const GmailOnboarding = () => {
  const {
    isConnected, senders, nextPageToken, isLoadingSenders, sendersError,
    fetchSenders, searchSenders, addSender, isAddingSender,
    onboardSavedSenders, isOnboarding, setupWatch,
  } = useGmail();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSenders, setSelectedSenders] = useState<Set<string>>(new Set());
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (isConnected) {
      searchSenders(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, isConnected, searchSenders]);

  const handleSelectSender = (email: string) => {
    setSelectedSenders(prev => {
      const newSet = new Set(prev);
      newSet.has(email) ? newSet.delete(email) : newSet.add(email);
      return newSet;
    });
  };

  const handleSaveSelected = async () => {
    const sendersToSave = senders.filter(s => selectedSenders.has(s.email));
    await Promise.all(
      sendersToSave.map(s => addSender({ name: s.name, email: s.email }))
    );
    alert(`${sendersToSave.length} senders saved! You can now onboard them.`);
    setSelectedSenders(new Set());
  };

  const handleOnboard = async () => {
    setOnboardingResult(null);
    const result = await onboardSavedSenders();
    if (result?.success) {
      setOnboardingResult(result);
      await setupWatch();
    }
  };

  // This component will not render its content if not connected
  if (!isConnected) {
    return null;
  }

  return (
    <div className="space-y-2 overflow-y-auto">
      {/* Step 1: Discover & Select */}
      <div className="p-6 border rounded-lg  shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">Step 1: Discover & Select Senders</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input
            placeholder="Search senders by name or email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="h-[400px] overflow-y-auto border rounded-md p-2 bg-zinc-50">
          {isLoadingSenders && !senders.length ? (
            <div className="flex items-center justify-center h-full text-zinc-500 gap-2"><Spinner /> Loading Senders...</div>
          ) : senders.length > 0 ? (
            <ul>
              {senders.map(sender => (
                <li key={sender.email} className="flex items-center p-3 hover:bg-zinc-100 rounded-md cursor-pointer" onClick={() => handleSelectSender(sender.email)}>
                  <div className="flex-shrink-0 w-6">
                    {selectedSenders.has(sender.email) ? <Check className="w-5 h-5 text-blue-600" /> : <div className="w-5 h-5 border-2 border-zinc-300 rounded-sm" />}
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center mr-4"><User className="w-6 h-6 text-zinc-500" /></div>
                  <div className="flex-grow"><p className="font-semibold text-zinc-800">{sender.name || 'No Name'}</p><p className="text-sm text-zinc-500">{sender.email}</p></div>
                </li>
              ))}
              {nextPageToken && (
                <div className="text-center mt-4">
                  <Button onClick={() => fetchSenders(nextPageToken)} disabled={isLoadingSenders} className="bg-zinc-600 hover:bg-zinc-700">{isLoadingSenders ? <Spinner /> : 'Load More'}</Button>
                </div>
              )}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">No senders found for your search.</div>
          )}
        </div>
        {sendersError && <p className="text-red-500 text-sm mt-2 flex items-center gap-2"><AlertTriangle size={16} />{sendersError}</p>}
      </div>

      {/* Step 2: Onboard */}
      <div className="p-6 border rounded-lg  shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">Step 2: Save & Onboard</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
          <div className="flex-grow">
            <h3 className="font-bold text-blue-800">{selectedSenders.size} Senders Selected</h3>
            <p className="text-sm text-blue-700">First, save selections. Then, onboard to fetch their emails and enable live updates.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSaveSelected} disabled={selectedSenders.size === 0 || isAddingSender} className="bg-blue-600 hover:bg-blue-700">{isAddingSender ? <Spinner /> : 'Save Selected'}</Button>
            <Button onClick={handleOnboard} disabled={isOnboarding} className="bg-green-600 hover:bg-green-700">{isOnboarding ? <Spinner /> : 'Onboard & Sync'}</Button>
          </div>
        </div>
        {onboardingResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 flex items-center gap-2"><PartyPopper size={20} /> Onboarding Complete!</h3>
            <p className="text-green-700 mt-1">Processed {onboardingResult.processed} emails from {onboardingResult.sendersOnboarded} senders. Live updates are active.</p>
          </div>
        )}
      </div>
    </div>
  );
};