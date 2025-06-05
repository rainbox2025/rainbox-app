import React from 'react';
import { BaseModal } from './base-modal';
import ConnectionCard from '@/components/settings/ConnectionCard';
import { Connection } from '@/types/data';
import { MOCK_RAINBOX_EMAIL } from './mock-newsletter-data';
import Image from 'next/image';
import { Button } from '../ui/button';
import { useGmail } from "@/context/gmailContext";
import { GmailConnectionFlow } from '../connect-gmail/flow';


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

  const { email, isConnected, connectGmail } = useGmail();
  const [isGmailFlowOpen, setIsGmailFlowOpen] = React.useState(false);



  const handleCopyRainboxEmail = () => {
    navigator.clipboard.writeText(MOCK_RAINBOX_EMAIL);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add a Newsletter to Rainbox">
      <div className="flex flex-col ">
        {/* Scrollable content */}
        <div className="flex-grow overflow-y-auto space-y-6  custom-scrollbar">

          <Image src="/newsletter-placeholder.png" alt="newsletter-placeholder" width={200} height={200} className='h-40 rounded-lg w-full' />

          <div>
            <h3 className="text-sm font-semibold mb-1">
              Subscribe to newsletters with your Rainbox email
            </h3>
            {/* <p className="text-xs text-muted-foreground mb-3">
              All newsletters sent to this address will appear in Rainbox.
            </p> */}
            <ConnectionCard
              logo="/RainboxLogo.png"
              logoAlt="Rainbox Logo"
              title="Rainbox - Primary Email"
              subtitle="ganesh123@rainbox.ai"
              actionType="copy"
              onAction={() => handleCopyRainboxEmail()}
              isConnected={true}
            />
            {/* <ConnectionCard
              logo="/GmailLogo.png"
              logoAlt="Gmail Logo"
              title="Gmail"
              subtitle={email || "Not connected"}
              actionType="select-sender"
              onAction={() => {
                if (isConnected && email) {
                  onSelectSender(email, "Gmail");
                } else {
                  connectGmail();
                }
              }}
              isConnected={isConnected}
            /> */}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-1">
              Select newsletters from your connected email
            </h3>
            {/* <p className="text-xs text-muted-foreground mb-3">
              Sync Newsletters from your other mailbox
            </p> */}
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
              {isConnected && (
                <ConnectionCard
                  logo="/gmail.webp"
                  logoAlt="Gmail Logo"
                  title="Gmail"
                  subtitle={email || "Not connected"}
                  actionType={isConnected ? "select-sender" : "connect"} // Adjusted actionType
                  onAction={() => {
                    if (isConnected && email) {
                      onSelectSender(email, "Gmail");
                    } else {
                      connectGmail(); // Call context function
                    }
                  }}
                  isConnected={isConnected}
                />
              )}

            </div>
          </div>

          <div className="w-full flex items-center justify-between px-2 text-sm">
            <button className="text-sm underline">Create new mailbox</button>
            {!isConnected ? <button onClick={() => setIsGmailFlowOpen(true)} className="text-sm underline">Connect Gmail</button> : <button title='Already connected' className="text-sm underline text-muted-foreground cursor-not-allowed">Gmail Connected</button>}
            <button className="text-sm underline">Connect Outlook</button>
          </div>
        </div>


      </div>

      <GmailConnectionFlow
        isOpen={isGmailFlowOpen}
        onClose={() => setIsGmailFlowOpen(false)}
        onConnectionComplete={() => setIsGmailFlowOpen(false)}
      />
    </BaseModal>

  );
};