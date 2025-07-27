"use client";

import React from "react";
import { BaseModal } from "./base-modal";
import ConnectionCard from "@/components/settings/ConnectionCard";
import Image from "next/image";
import { useGmail } from "@/context/gmailContext";
import { GmailConnectionFlow } from "../connect-gmail/flow";
import { useOutlook } from "@/context/outlookContext";
import { OutlookConnectionFlow } from "../connect-outlook/flow";
import { useAuth } from "@/context/authContext";
import { config } from "@/config";
import AddMailBox from "../settings/add-mail-box";

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
  const { email: gmailEmail, isConnected: gmailIsConnected } = useGmail();
  const { user, secondaryEmails, setSecondaryEmails, deleteSecondaryEmail } =
    useAuth();
  const [isGmailFlowOpen, setIsGmailFlowOpen] = React.useState(false);
  const { email: outlookEmail, isConnected: outlookIsConnected } =
    useOutlook();
  const [isOutlookFlowOpen, setIsOutlookFlowOpen] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [isAddMailboxOpen, setIsAddMailboxOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setIsGmailFlowOpen(false);
      setIsOutlookFlowOpen(false);
    }
  }, [isOpen]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const handleDeleteEmail = async (email: string) => {
    const originalEmails = [...secondaryEmails];
    setSecondaryEmails(secondaryEmails.filter((e) => e !== email));

    try {
      await deleteSecondaryEmail(email, user?.id ?? "");
    } catch (error) {
      setSecondaryEmails(originalEmails);
    }
  };

  const primaryEmail = `${user?.user_name || "user_name"}@${config.emailDomain
    }`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a Newsletter to Rainbox"
    >
      <div className="flex flex-col max-h-[75vh] overflow-y-hidden custom-scrollbar">
        <div className="flex-grow overflow-y-auto space-y-6 custom-scrollbar">
          <Image
            src="/newsletter-placeholder.png"
            alt="newsletter-placeholder"
            width={200}
            height={200}
            className="h-40 rounded-lg w-full"
          />
          <div>
            <h3 className="text-sm font-semibold mb-1">
              Subscribe to newsletters with your Rainbox email
            </h3>
            <div className="space-y-2">
              <ConnectionCard
                logo="/RainboxLogo.png"
                logoAlt="Rainbox Logo"
                title="Rainbox - Primary Email"
                subtitle={primaryEmail}
                actionType="copy"
                onAction={() => handleCopy("primary-modal", primaryEmail)}
                isConnected={true}
                isCopied={copiedId === "primary-modal"}
              />
              {secondaryEmails.map((email) => {
                const fullEmail = `${email}@${config.emailDomain ?? ""
                  }`.replace(/%$/, "");
                return (
                  <ConnectionCard
                    key={email}
                    logo="/RainboxLogo.png"
                    logoAlt="Rainbox Logo"
                    title="Rainbox - Secondary Email"
                    subtitle={fullEmail}
                    actionType="copy"
                    onAction={() => handleCopy(email, fullEmail)}
                    onSecondaryAction={() => handleDeleteEmail(email)}
                    isCopied={copiedId === email}
                  />
                );
              })}
            </div>
          </div>

          <div>
            {(outlookIsConnected || gmailIsConnected) && (
              <h3 className="text-sm font-semibold mb-1">
                Select newsletters from your connected email
              </h3>
            )}

            <div className="flex flex-col gap-2">
              {outlookIsConnected && (
                <ConnectionCard
                  logo="/OutlookLogo.png"
                  logoAlt="Outlook Logo"
                  title="Outlook"
                  subtitle={outlookEmail || "Not connected"}
                  actionType="select-sender"
                  onAction={() => {
                    if (outlookEmail) {
                      onSelectSender(outlookEmail, "Outlook");
                    }
                  }}
                  isConnected={true}
                />
              )}

              {gmailIsConnected && (
                <ConnectionCard
                  logo="/gmail.webp"
                  logoAlt="Gmail Logo"
                  title="Gmail"
                  subtitle={gmailEmail || "Not connected"}
                  actionType="select-sender"
                  onAction={() => {
                    if (gmailEmail) {
                      onSelectSender(gmailEmail, "Gmail");
                    }
                  }}
                  isConnected={true}
                />
              )}
            </div>
          </div>

          <div className="w-full flex items-center justify-between px-2 text-sm">
            <button onClick={() => setIsAddMailboxOpen(true)} className="text-sm underline">Create new mailbox</button>
            {!gmailIsConnected ? (
              <button
                onClick={() => setIsGmailFlowOpen(true)}
                className="text-sm underline"
              >
                Connect Gmail
              </button>
            ) : (
              <button
                title="Already connected"
                className="text-sm underline text-muted-foreground cursor-not-allowed"
              >
                Gmail Connected
              </button>
            )}
            {!outlookIsConnected ? (
              <button
                onClick={() => setIsOutlookFlowOpen(true)}
                className="text-sm underline"
              >
                Connect Outlook
              </button>
            ) : (
              <button
                title="Already connected"
                className="text-sm underline text-muted-foreground cursor-not-allowed"
              >
                Outlook Connected
              </button>
            )}
          </div>
        </div>
      </div>

      <AddMailBox
        showAddMailbox={isAddMailboxOpen}
        handleCloseModal={() => setIsAddMailboxOpen(false)}
      />

      <GmailConnectionFlow
        isOpen={isGmailFlowOpen}
        onClose={() => setIsGmailFlowOpen(false)}
        onConnectionComplete={() => {
          setIsGmailFlowOpen(false);
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