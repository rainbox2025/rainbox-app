import React from 'react';
import { BaseModal } from './base-modal';
import ConnectionCard from '@/components/settings/ConnectionCard';
import { Connection } from '@/types/data';
import Image from 'next/image';
import { Button } from '../ui/button';

// Import contexts and flows for both Gmail and Outlook
import { useGmail } from "@/context/gmailContext";
import { GmailConnectionFlow } from '../connect-gmail/flow'; // Assuming path is correct
import { useOutlook } from '@/context/outlookContext';
import { OutlookConnectionFlow } from '../connect-outlook/flow'; // Assuming index.tsx is the flow entry

interface AddNewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSender: (email: string, accountName: string) => void;
}

export const AddNewsletterModal: React.FC<AddNewsletterModalProps> = ({
  isOpen,
  onClose,
  onSelectSender,
}) => {
  // State and hooks for Gmail
  const { email: gmailEmail, isConnected: gmailIsConnected } = useGmail();
  const [isGmailFlowOpen, setIsGmailFlowOpen] = React.useState(false);

  // State and hooks for Outlook
  const { email: outlookEmail, isConnected: outlookIsConnected } = useOutlook();
  const [isOutlookFlowOpen, setIsOutlookFlowOpen] = React.useState(false);

  const handleCopyRainboxEmail = () => {
    navigator.clipboard.writeText("nothing");
  };

  // Close child flows when the main modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsGmailFlowOpen(false);
      setIsOutlookFlowOpen(false);
    }
  }, [isOpen]);

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
            {(outlookIsConnected || gmailIsConnected) && (
              <h3 className="text-sm font-semibold mb-1">
                Select newsletters from your connected email
              </h3>
            )}

            <div className='flex flex-col gap-2'>
              {/* DYNAMIC OUTLOOK CARD */}
              {outlookIsConnected && (
                <ConnectionCard
                  logo="/OutlookLogo.png"
                  logoAlt="Outlook Logo"
                  title="Outlook"
                  subtitle={outlookEmail || "Not connected"}
                  actionType={outlookIsConnected ? "select-sender" : "connect"}
                  onAction={() => {
                    if (outlookIsConnected && outlookEmail) {
                      onSelectSender(outlookEmail, "Outlook");
                    } else {
                      setIsOutlookFlowOpen(true); // Open the modal flow
                    }
                  }}
                  isConnected={outlookIsConnected}
                />
              )}

              {/* DYNAMIC GMAIL CARD */}
              {gmailIsConnected && (
                <ConnectionCard
                  logo="/gmail.webp"
                  logoAlt="Gmail Logo"
                  title="Gmail"
                  subtitle={gmailEmail || "Not connected"}
                  actionType={gmailIsConnected ? "select-sender" : "connect"}
                  onAction={() => {
                    if (gmailIsConnected && gmailEmail) {
                      onSelectSender(gmailEmail, "Gmail");
                    } else {
                      setIsGmailFlowOpen(true); // Open the modal flow
                    }
                  }}
                  isConnected={gmailIsConnected}
                />
              )}

            </div>
          </div>

          <div className="w-full flex items-center justify-between px-2 text-sm">
            <button className="text-sm underline">Create new mailbox</button>
            {/* Gmail Connection Link */}
            {!gmailIsConnected ? (
              <button onClick={() => setIsGmailFlowOpen(true)} className="text-sm underline">Connect Gmail</button>
            ) : (
              <button title='Already connected' className="text-sm underline text-muted-foreground cursor-not-allowed">Gmail Connected</button>
            )}
            {/* Outlook Connection Link */}
            {!outlookIsConnected ? (
              <button onClick={() => {
                console.log('clicked');
                setIsOutlookFlowOpen(true)
              }} className="text-sm underline">Connect Outlook</button>
            ) : (
              <button title='Already connected' className="text-sm underline text-muted-foreground cursor-not-allowed">Outlook Connected</button>
            )}
          </div>
        </div>
      </div>

      {/* Connection Flow Modals */}
      <GmailConnectionFlow
        isOpen={isGmailFlowOpen}
        onClose={() => setIsGmailFlowOpen(false)}
        onConnectionComplete={() => {
          setIsGmailFlowOpen(false);
          // Optional: you could close the main modal here too if desired
          // onClose();
        }}
      />
      <OutlookConnectionFlow
        isOpen={isOutlookFlowOpen}
        onClose={() => setIsOutlookFlowOpen(false)}
        onConnectionComplete={() => {
          setIsOutlookFlowOpen(false);
        }}
      />
    </BaseModal>
  );
};