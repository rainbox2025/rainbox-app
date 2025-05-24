import React from 'react';
import { BaseModal } from './base-modal';
import ConnectionCard from '@/components/settings/ConnectionCard';
import { Connection } from '@/types/data';
import { MOCK_RAINBOX_EMAIL } from './mock-newsletter-data';
import Image from 'next/image';
import { Button } from '../ui/button';

interface AddNewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[];
  onSelectSender: (email: string, accountName: string) => void;
}

export const AddNewsletterModal: React.FC<AddNewsletterModalProps> = ({
  isOpen,
  onClose,
  connections,
  onSelectSender,
}) => {

  const handleCopyRainboxEmail = () => {
    navigator.clipboard.writeText(MOCK_RAINBOX_EMAIL);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add a Newsletter to Rainbox">
      <div className="flex flex-col h-[75vh]">
        {/* Scrollable content */}
        <div className="flex-grow overflow-y-auto space-y-6 pr-2 custom-scrollbar">

          <Image src="/newsletter-placeholder.png" alt="newsletter-placeholder" width={200} height={200} className='h-40 rounded-lg w-full' />

          <div>
            <h3 className="text-sm font-semibold mb-1">
              Subscribe to newsletters with your Rainbox email
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
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
            <h3 className="text-sm font-semibold mb-1">
              Select newsletters from your connected email
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
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
            <button className="text-sm underline">Create new mailbox</button>
            <button className="text-sm underline">Connect Gmail</button>
            <button className="text-sm underline">Connect Outlook</button>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="p-4 pb-0 border-t text-right">
          <Button onClick={onClose} className="bg-primary text-sm font-medium py-2 px-4 rounded-md transition-colors">
            Close
          </Button>
        </div>
      </div>
    </BaseModal>

  );
};