// src/components/newsletter/select-newsletter-modal.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BaseModal } from './base-modal';
import { CheckCircleIcon, SearchIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';
import { Button } from '../ui/button';
import { CircleIcon, Loader2 } from 'lucide-react';
import { useGmail, Sender } from '@/context/gmailContext';
import { useDebounce } from '@/hooks/useDebounce';

interface SelectNewslettersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAddNewsletters: (selected: Sender[]) => void;
  connectedAccountName?: string;
}

export const SelectNewslettersModal: React.FC<SelectNewslettersModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onAddNewsletters,
  connectedAccountName
}) => {
  const {
    senders,
    fetchSenders,
    searchSenders,
    addSender,
    onboardSavedSenders,
    setupWatch,
    isLoadingSenders,
    isAddingSender,
    isOnboarding,
    nextPageToken,
  } = useGmail();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSenderEmails, setSelectedSenderEmails] = useState<Set<string>>(new Set());
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      searchSenders(debouncedSearchTerm);
    }
  }, [isOpen, debouncedSearchTerm, searchSenders]);

  const selectedSenders = useMemo(() => {
    return senders.filter(s => selectedSenderEmails.has(s.email));
  }, [senders, selectedSenderEmails]);

  const unselectedSenders = useMemo(() => {
    return senders.filter(s => !selectedSenderEmails.has(s.email));
  }, [senders, selectedSenderEmails]);

  const toggleSenderSelection = (email: string) => {
    setSelectedSenderEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(email)) {
        newSet.delete(email);
      } else {
        newSet.add(email);
      }
      return newSet;
    });
  };

  const handleAddSelected = async () => {
    const sendersToAdd = senders.filter(s => selectedSenderEmails.has(s.email));

    // Step 1: Save senders to your DB
    await Promise.all(
      sendersToAdd.map(s => addSender({ name: s.name, email: s.email }))
    );

    // Step 2: Onboard their emails
    const result = await onboardSavedSenders();

    // Step 3: Set up watch for future emails and finalize
    if (result?.success) {
      await setupWatch();
      onAddNewsletters(sendersToAdd);
    } else {
      // You could trigger an error modal here if needed
      console.error("Onboarding failed");
    }
  };

  const isLoading = isLoadingSenders || isAddingSender || isOnboarding;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Select Newsletters" >
      <div className="flex flex-col h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
        <p className="text-xs text-muted-foreground mb-4">
          Choose senders to import newsletters from your connected {connectedAccountName || 'email'}.
        </p>

        <div className="relative mb-4" ref={searchContainerRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 " />
          </div>
          <input
            type="text"
            placeholder="Search Newsletters"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className=" p-3 pl-10 w-[98%] bg-content border border-hovered rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:ml-1  text-sm"
          />
          {isLoadingSenders ?
            <div className="absolute inset-y-0 right-2 pl-3 flex items-center pointer-events-none">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            </div>
            : null}
        </div>

        {selectedSenders.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-1.5">Selected Newsletters</h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {selectedSenders.map((sender) => (
                <div key={`selected-${sender.email}`} onClick={() => toggleSenderSelection(sender.email)} className="flex cursor-pointer items-center p-2 border border-blue-400 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-2.5 flex-shrink-0" />
                  <div><p className="text-sm font-medium">{sender.name}</p><p className="text-xs text-muted-foreground">{sender.email}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
        <h3 className="text-sm font-semibold mb-1.5 sticky top-0 py-2 z-10">
          Available Senders
        </h3>
        <div className="flex-grow overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">

          {isLoadingSenders && !unselectedSenders.length ? (
            <div className="flex justify-center items-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : unselectedSenders.length > 0 ? (
            <>
              {unselectedSenders.map((sender) => (
                <div key={sender.email} onClick={() => toggleSenderSelection(sender.email)} className="flex items-center p-2 border border-hovered rounded-lg cursor-pointer hover:border-hovered/50 hover:bg-hovered transition-colors">
                  <CircleIcon className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                  <div><p className="text-sm font-medium">{sender.name}</p><p className="text-xs text-muted-foreground">{sender.email}</p></div>
                </div>
              ))}
              {nextPageToken && (
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => fetchSenders(nextPageToken)} disabled={isLoadingSenders}>Load More</Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No more senders found.</p>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-hovered flex justify-between items-center">
          <button onClick={onBack} className="bg-hovered text-sm font-medium py-2 px-4 rounded-md flex items-center">
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
          </button>
          <Button onClick={handleAddSelected} disabled={selectedSenders.length === 0 || isLoading}>
            {isAddingSender ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Add Selected
            <ArrowRightIcon className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};