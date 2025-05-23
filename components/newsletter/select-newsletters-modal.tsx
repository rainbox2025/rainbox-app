import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BaseModal } from './base-modal';
import { Sender } from '@/types/data';
import { CheckCircleIcon, SearchIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';
import { Button } from '../ui/button';
import { CircleIcon } from 'lucide-react';

interface SelectNewslettersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onAddNewsletters: (selected: Sender[]) => void;
  suggestedSenders: Sender[];
  connectedAccountName?: string;
}

export const SelectNewslettersModal: React.FC<SelectNewslettersModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onAddNewsletters,
  suggestedSenders,
  connectedAccountName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSenders, setSelectedSenders] = useState<Sender[]>([]);
  const [isSearchDropdownVisible, setIsSearchDropdownVisible] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Derived state for unselected senders
  const unselectedSenders = useMemo(() => {
    return suggestedSenders.filter(
      (s) => !selectedSenders.find((sel) => sel.id === s.id)
    );
  }, [suggestedSenders, selectedSenders]);

  // Derived state for items shown in the search dropdown
  const searchDropdownItems = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }
    return unselectedSenders.filter(
      (sender) =>
        sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sender.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [unselectedSenders, searchTerm]);

  const toggleSenderSelection = (sender: Sender) => {
    setSelectedSenders((prevSelected) =>
      prevSelected.find((s) => s.id === sender.id)
        ? prevSelected.filter((s) => s.id !== sender.id) // This case might not be hit from UI if selected items are only in "Selected" list
        : [...prevSelected, sender]
    );
  };

  const handleAddSelected = () => {
    onAddNewsletters(selectedSenders);
  };

  // Effect to handle clicks outside the search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownVisible(false);
      }
    }
    if (isSearchDropdownVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchDropdownVisible]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Select Newsletters" >
      <div className="flex flex-col h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
        <p className="text-xs text-muted-foreground mb-4">
          Choose senders to import newsletters from your connected {connectedAccountName || 'Gmail or Outlook'}.
        </p>

        {/* Search Bar and Dropdown Section */}
        <div className="relative mb-4" ref={searchContainerRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 " />
          </div>
          <input
            type="text"
            placeholder="Search Newsletters"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearchDropdownVisible(true); // Show dropdown as user types
            }}
            onFocus={() => setIsSearchDropdownVisible(true)}
            className=" p-3 pl-10 w-[98%] bg-content border border-hovered rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:ml-1  text-sm"
          />
          {isSearchDropdownVisible && searchTerm.trim() && (
            <div className="absolute z-20 w-full mt-1 bg-sidebar border border-hovered rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
              {searchDropdownItems.length > 0 ? (
                searchDropdownItems.map((sender) => (
                  <div
                    key={`search-${sender.id}`}
                    className="p-2.5  cursor-pointer"
                    onClick={() => {
                      toggleSenderSelection(sender);
                      setSearchTerm('');
                      setIsSearchDropdownVisible(false);
                    }}
                  >
                    <div className='flex gap-2 items-center'>
                      {/* Optionally, add an icon here like a small plus or add icon */}
                      <p className="text-sm font-medium ">{sender.name}</p>
                      <p className="text-xs text-muted-foreground">{sender.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center p-3">No unselected senders match your search.</p>
              )}
            </div>
          )}
        </div>

        {/* Selected Newsletters Section */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold  mb-1.5">Selected Newsletters</h3>
          {selectedSenders.length === 0 ? (
            <p className="text-xs text-muted-foreground">No newsletters selected. Use search or select from the list below.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar"> {/* Increased max-h slightly */}
              {selectedSenders.map((sender) => (
                <div
                  key={`selected-${sender.id}`}
                  onClick={() => toggleSenderSelection(sender)}
                  className="flex cursor-pointer items-center p-2 border border-blue-400  rounded-lg"
                >
                  <CheckCircleIcon className="w-5 h-5 text-blue-400 mr-2.5 flex-shrink-0" />
                  <div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
                    <p className="text-sm font-medium  truncate max-w-[150px] sm:max-w-none">{sender.name}</p>
                    <p className="text-xs text-muted-foreground">{sender.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Newsletters Section (previously Suggested Senders) */}
        <div className="flex-grow overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
          <h3 className="text-sm font-semibold  mb-1.5 sticky top-0 py-2 z-10">
            Available Senders - Regular senders in your inbox
          </h3>
          {unselectedSenders.length > 0 ? (
            unselectedSenders.map((sender) => (
              <div
                key={sender.id}
                onClick={() => toggleSenderSelection(sender)}
                className="flex items-center p-2 border border-hovered rounded-lg cursor-pointer hover:border-hovered/50 hover:bg-hovered transition-colors"
              >
                {/* Unselected CheckCircleIcon */}
                <CircleIcon className="w-4 h-4 text-muted-foreground mr-3 flex-shrink-0" />
                <div className='flex flex-col sm:flex-row sm:items-center sm:gap-2'>
                  <p className="text-sm font-medium  truncate max-w-[150px] sm:max-w-none">{sender.name}</p>
                  <p className="text-xs text-muted-foreground">{sender.email}</p>
                </div>
              </div>
            ))
          ) : (
            searchTerm ? (
              <p className="text-xs text-muted-foreground text-center py-4">All matching senders have been selected, or clear search to see all available.</p>
            ) : suggestedSenders.length > 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">All suggested senders have been selected.</p>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No suggested senders available to select.</p>
            )
          )}
        </div>

        {/* Footer Buttons */}
        <div className="mt-auto pt-4 border-t border-hovered flex justify-between items-center">
          <button
            onClick={onBack}
            className="bg-hovered text-sm font-medium py-2 px-4 rounded-md  flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
          </button>


          <Button onClick={handleAddSelected}
            disabled={selectedSenders.length === 0}
            className='text-sm font-medium py-2 px-4 rounded-md flex items-center'
          >
            Add Selected Newsletters <ArrowRightIcon className="w-4 h-4 ml-1.5" /> {/* Removed transform -rotate-180 */}

          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
