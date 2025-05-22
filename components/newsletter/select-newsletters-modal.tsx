
import React, { useState, useMemo } from 'react';
import { BaseModal } from './base-modal';
import { Sender } from '@/types/data';
import { CheckCircleIcon, SearchIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';

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

  const filteredSenders = useMemo(() => {
    return suggestedSenders.filter(
      (sender) =>
        sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sender.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suggestedSenders, searchTerm]);

  const toggleSenderSelection = (sender: Sender) => {
    setSelectedSenders((prevSelected) =>
      prevSelected.find((s) => s.id === sender.id)
        ? prevSelected.filter((s) => s.id !== sender.id)
        : [...prevSelected, sender]
    );
  };

  const handleAddSelected = () => {
    onAddNewsletters(selectedSenders);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Select Newsletters" widthClass="max-w-lg">
      <div className="flex flex-col h-[600px]">
        <p className="text-xs text-neutral-500 mb-4 -mt-2">
          Choose senders to import newsletters from your connected {connectedAccountName || 'Gmail or Outlook'}.
        </p>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search Newsletters"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {/* "Drop down" text is not implemented as a visual dropdown, search filters the list below */}
        </div>

        {/* Selected Newsletters Section */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-neutral-700 mb-1.5">Selected Newsletters</h3>
          {selectedSenders.length === 0 ? (
            <p className="text-xs text-neutral-500">No newsletters selected</p>
          ) : (
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {selectedSenders.map((sender) => (
                <div
                  key={`selected-${sender.id}`}
                  className="flex items-center p-2.5 border border-blue-500 bg-blue-50 rounded-md"
                >
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{sender.name}</p>
                    <p className="text-xs text-blue-700">{sender.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Senders Section */}
        <div className="flex-grow overflow-y-auto pr-1 space-y-1.5  custom-scrollbar">
          <h3 className="text-sm font-semibold text-neutral-700 mb-1.5 sticky top-0 bg-white py-1">
            Suggested - Regular senders in your inbox
          </h3>
          {filteredSenders.map((sender) => {
            const isSelected = !!selectedSenders.find((s) => s.id === sender.id);
            return (
              <label
                key={sender.id}
                htmlFor={`sender-${sender.id}`}
                className={`flex items-center p-2.5 border rounded-md cursor-pointer hover:border-neutral-400 transition-colors
                                ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-neutral-300'}`}
              >
                <input
                  type="checkbox"
                  id={`sender-${sender.id}`}
                  checked={isSelected}
                  onChange={() => toggleSenderSelection(sender)}
                  className="h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 mr-3"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-800">{sender.name}</p>
                  <p className="text-xs text-neutral-500">{sender.email}</p>
                </div>
              </label>
            );
          })}
          {filteredSenders.length === 0 && searchTerm && (
            <p className="text-xs text-neutral-500 text-center py-4">No senders match your search.</p>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="mt-auto pt-4 border-t border-neutral-200 flex justify-between items-center">
          <button
            onClick={onBack}
            className="bg-neutral-200 text-neutral-700 text-sm font-medium py-2 px-4 rounded-md hover:bg-neutral-300 flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1.5" /> Back
          </button>
          <button
            onClick={handleAddSelected}
            disabled={selectedSenders.length === 0}
            className="bg-neutral-800 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-neutral-700 disabled:opacity-50 flex items-center"
          >
            Add Selected Newsletters <ArrowRightIcon className="w-4 h-4 ml-1.5 transform -rotate-180" /> {/* Corrected Icon Usage */}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};