"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BaseModal } from './base-modal';
import { CheckCircleIcon, SearchIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';
import { Button } from '../ui/button';
import { CircleIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGmail, Sender } from '@/context/gmailContext';
import { useOutlook } from '@/context/outlookContext';
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
  const isGmail = connectedAccountName === 'Gmail';
  const gmailContext = useGmail();
  const outlookContext = useOutlook();
  const activeContext = isGmail ? gmailContext : outlookContext;

  const {
    senders,
    fetchSenders,
    searchSenders,
    addSender,
    onboardSavedSenders,
    setupWatch,
    isLoadingSenders,
    nextPageToken,
  } = activeContext;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSenderEmails, setSelectedSenderEmails] = useState<Set<string>>(new Set());
  const [allSelectedObjects, setAllSelectedObjects] = useState<Sender[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const lastSearchedTerm = useRef<string | null>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setSelectedSenderEmails(new Set());
      setAllSelectedObjects([]);
      setSearchTerm('');
      lastSearchedTerm.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const trimmedSearch = debouncedSearchTerm.trim();
    if (trimmedSearch === lastSearchedTerm.current) return;

    if (trimmedSearch) setIsSearching(true);

    searchSenders(trimmedSearch).finally(() => {
      setIsSearching(false);
    });
    lastSearchedTerm.current = trimmedSearch;
  }, [isOpen, debouncedSearchTerm, searchSenders]);

  const unselectedSenders = useMemo(() => {
    return senders.filter(s => !selectedSenderEmails.has(s.email));
  }, [senders, selectedSenderEmails]);

  // The state updates are no longer nested, preventing race conditions.
  const toggleSenderSelection = (sender: Sender) => {
    const email = sender.email;
    const newSelectedEmails = new Set(selectedSenderEmails);

    if (newSelectedEmails.has(email)) {
      newSelectedEmails.delete(email);
      setAllSelectedObjects(current => current.filter(s => s.email !== email));
    } else {
      newSelectedEmails.add(email);
      setAllSelectedObjects(current => [...current, sender]);
    }

    setSelectedSenderEmails(newSelectedEmails);
  };

  const handleAddSelected = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  // Immediately close modal and toast info
  onClose();
  toast.loading("We’ll add these newsletters in ~2 minutes…", { duration: 3000 });

  try {
    const sendersToAdd = allSelectedObjects;
    await Promise.all(
      sendersToAdd.map(s => addSender({ name: s.name, email: s.email }))
    );
    const result = await onboardSavedSenders();
    if (result?.success) {
      await setupWatch();
      onAddNewsletters(sendersToAdd);
      toast.success("Newsletters successfully added 🎉");
    } else {
      toast.error(result?.message || "Onboarding failed. Try again.");
    }
  } catch (error) {
    console.error("Error while adding newsletters:", error);
    toast.error("Something went wrong while adding newsletters.");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleScroll = useCallback(() => {
    const container = listContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isNearBottom && !isLoadingSenders && nextPageToken && !debouncedSearchTerm.trim()) {
        fetchSenders(nextPageToken);
      }
    }
  }, [isLoadingSenders, nextPageToken, fetchSenders, debouncedSearchTerm]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Select Newsletters" padding='pr-1'>
      <div className="flex flex-col max-h-[75vh] overflow-y-scroll custom-scrollbar">
        <div className='pr-4'>
          <p className="text-xs text-muted-foreground mb-4">
            Choose senders to import newsletters from your connected {connectedAccountName || 'email'}.
          </p>
          <div className="relative mb-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search Newsletters"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 pl-10 ml-[2px] w-full bg-content border border-hovered rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-sm"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-2 pl-3 flex items-center pointer-events-none">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              </div>
            )}
          </div>

        </div>
        <div className='h-[70vh] pr-1 overflow-y-scroll custom-scrollbar'>
          {allSelectedObjects.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold my-1.5">Selected Newsletters</h3>
              <div className="space-y-1.5  pr-1 ">
                {allSelectedObjects.map((sender) => (
                  <div key={`selected-${sender.email}`} onClick={() => toggleSenderSelection(sender)} className="flex cursor-pointer items-center p-2 border border-blue-400 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-2.5 flex-shrink-0" />
                    <div><p className="text-sm font-medium">{sender.name || sender.email}</p><p className="text-xs text-muted-foreground">{sender.email}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <h3 className="text-sm font-semibold  sticky top-0 bg-content py-2 z-10">
            Available Senders
          </h3>
          <div
            ref={listContainerRef}
            onScroll={handleScroll}
            className="flex-grow  pr-1 space-y-1.5"
          >
            {isLoadingSenders && !isSearching && unselectedSenders.length === 0 ? (
              <div className="flex justify-center items-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : unselectedSenders.length > 0 ? (
              <>
                {unselectedSenders.map((sender) => (
                  <div key={sender.email} onClick={() => toggleSenderSelection(sender)} className="flex items-center p-2 border border-hovered rounded-lg cursor-pointer hover:border-hovered/50 hover:bg-hovered transition-colors">
                    <CircleIcon className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                    <div><p className="text-sm font-medium">{sender.name || sender.email}</p><p className="text-xs text-muted-foreground">{sender.email}</p></div>
                  </div>
                ))}
                {isLoadingSenders && !isSearching && unselectedSenders.length > 0 && (
                  <div className="flex justify-center items-center py-4"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                )}
              </>
            ) : !isLoadingSenders && !isSearching ? (
              <p className="text-xs text-muted-foreground text-center py-4">No senders found for your search.</p>
            ) : null}
          </div>

        </div>
        <div className="mt-auto pt-4 border-t border-hovered flex justify-between items-center px-1">
          <button onClick={onBack} className="bg-hovered text-sm font-medium py-2 px-4 rounded-md flex items-center">
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
          </button>
          <Button onClick={handleAddSelected} disabled={allSelectedObjects.length === 0 || isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isSubmitting ? 'Adding...' : 'Add Selected'}
            {!isSubmitting && <ArrowRightIcon className="w-4 h-4 ml-1.5" />}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};