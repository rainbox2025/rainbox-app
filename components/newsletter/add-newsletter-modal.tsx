import React from 'react';
import { BaseModal } from './base-modal';
import ConnectionCard from '@/components/settings/ConnectionCard';
import { Connection } from '@/types/data';
import { MOCK_RAINBOX_EMAIL } from './mock-newsletter-data';
import Image from 'next/image';

interface AddNewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  onConnectGmail: () => void;
  onConnectOutlook: () => void;
  onSelectSender: (email: string, accountName: string) => void;
  onCreateNewMailbox: () => void;
}

export const AddNewsletterModal: React.FC<AddNewsletterModalProps> = ({
  isOpen,
  onClose,
  connections,
  onConnectGmail,
  onConnectOutlook,
  onSelectSender,
  onCreateNewMailbox,
}) => {

  const handleCopyRainboxEmail = () => {
    navigator.clipboard.writeText(MOCK_RAINBOX_EMAIL);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add a Newsletter to Rainbox">
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">

        <Image src="/newsletter-placeholder.png" alt="newsletter-placeholder" width={200} height={200} className=' h-40 rounded-lg w-full' />
        <div>
          <h3 className="text-sm font-semibold text-neutral-800 mb-1">
            Subscribe to newsletters with your Rainbox email
          </h3>
          <p className="text-xs text-neutral-500 mb-3">
            All newsletters sent to this address will appear in Rainbox.
          </p>
          <ConnectionCard
            logo="/RainboxLogo.png"
            logoAlt="Rainbox Logo"
            title="Rainbox - Primary Email"
            subtitle="ganesh123@rainbox.ai"
            actionType="copy"
            onAction={() => handleCopyRainboxEmail()}
            isConnected={true}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-800 mb-1">
            Select newsletters from your connected email
          </h3>
          <p className="text-xs text-neutral-500 mb-3">
            Sync Newsletters from your other mailbox
          </p>
          <div className='flex flex-col gap-2'>
            <ConnectionCard
              logo="/OutlookLogo.png"
              logoAlt="Outlook Logo"
              title="Ganesh's Outlook"
              subtitle="ganesh123@outlook.com"
              actionType="select-sender"
              onAction={() => onSelectSender("ganesh123@outlook.com", "Ganesh's Outlook")}
              isConnected={true}
            />
          </div>

        </div>

        <div className="w-full flex items-center justify-between px-2 text-sm">
          <button onClick={onCreateNewMailbox} className="text-neutral-600 hover:text-neutral-800 underline">
            Create new mailbox
          </button>
          <button onClick={onConnectGmail} className="text-neutral-600 hover:text-neutral-800 underline">
            Connect Gmail
          </button>
          <button onClick={onConnectOutlook} className="text-neutral-600 hover:text-neutral-800 underline">
            Connect Outlook
          </button>
        </div>

        <div className="pt-2 border-t border-neutral-200 text-right">
          <button
            onClick={onClose}
            className="bg-neutral-200 text-neutral-700 text-sm font-medium py-2 px-4 rounded-md hover:bg-neutral-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
};