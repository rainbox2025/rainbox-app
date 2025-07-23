"use client";

import React, { useState } from "react";
import Image from "next/image";
import ConnectionCard from "../ConnectionCard";
import { GmailConnectionFlow } from "@/components/connect-gmail/flow";
import { OutlookConnectionFlow } from "@/components/connect-outlook/flow";
import AddMailBox from "../add-mail-box";
import DisconnectBox from "../disconnect-box";
import { useGmail } from "@/context/gmailContext";
import { useOutlook } from "@/context/outlookContext";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { config } from "@/config";

export default function MailboxTab() {
  const {
    isConnected: isGmailConnected,
    email: gmailEmail,
    isLoading: isGmailLoading,
    disconnectGmail,
  } = useGmail();
  const { user, deleteSecondaryEmail, setSecondaryEmails, secondaryEmails } =
    useAuth();
  const {
    isConnected: isOutlookConnected,
    email: outlookEmail,
    isLoading: isOutlookLoading,
    disconnectOutlook,
  } = useOutlook();

  const [showAddMailbox, setShowAddMailbox] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState<{
    service: "gmail" | "outlook" | null;
  }>({ service: null });
  const [isGmailFlowOpen, setIsGmailFlowOpen] = useState(false);
  const [isOutlookFlowOpen, setIsOutlookFlowOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [username, setUsername] = useState("");

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      if (showDisconnectModal.service === "gmail") {
        await disconnectGmail();
      } else if (showDisconnectModal.service === "outlook") {
        await disconnectOutlook();
      }
    } catch (e) {
      console.error("Failed to disconnect:", e);
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectModal({ service: null });
    }
  };

  const handleCloseModals = () => {
    setShowAddMailbox(false);
    setShowDisconnectModal({ service: null });
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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const isLoading = isGmailLoading || isOutlookLoading;
  const primaryEmail = `${user?.user_name || "user"}@${config.emailDomain}`;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Mailbox</h2>
          <p className="text-sm text-muted-foreground">
            Manage your email addresses
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Rainbox Email Address</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use this email address when subscribing to newsletters. All
              newsletters sent to this address will appear here in Meco.
            </p>
            <div className="space-y-4">
              <ConnectionCard
                logo="/RainboxLogo.png"
                logoAlt="Rainbox Logo"
                title="Rainbox - Primary Email"
                subtitle={primaryEmail}
                actionType="copy"
                onAction={() => handleCopy("primary", primaryEmail)}
                isCopied={copiedId === "primary"}
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
                    actionType="manage-secondary"
                    onAction={() => handleCopy(email, fullEmail)}
                    onSecondaryAction={() => handleDeleteEmail(email)}
                    isCopied={copiedId === email}
                  />
                );
              })}
            </div>
            <button
              onClick={() => setShowAddMailbox(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 border border-border rounded-md bg-hovered hover:bg-hovered transition-colors text-sm"
            >
              + Add a secondary mailbox
            </button>
          </div>

          <hr className="border-border" />

          <div>
            <h3 className="font-medium mb-2">Connect your Gmail or Outlook</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bring your existing newsletters from Gmail or Outlook to Rainbox.
              Just sign in and select the sender — that's it!
            </p>

            <div className="space-y-4">
              {isLoading && !isDisconnecting ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <ConnectionCard
                    logo="/gmail.webp"
                    logoAlt="Gmail Logo"
                    title={isGmailConnected ? "Gmail" : "Connect your Gmail"}
                    subtitle={
                      isGmailConnected ? gmailEmail : "No account connected"
                    }
                    actionType={isGmailConnected ? "disconnect" : "connect"}
                    onAction={() =>
                      isGmailConnected
                        ? setShowDisconnectModal({ service: "gmail" })
                        : setIsGmailFlowOpen(true)
                    }
                    isConnected={isGmailConnected}
                  />
                  <ConnectionCard
                    logo="/OutlookLogo.png"
                    logoAlt="Outlook Logo"
                    title={
                      isOutlookConnected ? "Outlook" : "Connect your Outlook"
                    }
                    subtitle={
                      isOutlookConnected ? outlookEmail : "No account connected"
                    }
                    actionType={isOutlookConnected ? "disconnect" : "connect"}
                    onAction={() =>
                      isOutlookConnected
                        ? setShowDisconnectModal({ service: "outlook" })
                        : setIsOutlookFlowOpen(true)
                    }
                    isConnected={isOutlookConnected}
                  />
                </>
              )}
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <h3 className="font-medium mb-2">
              Automatically forward existing newsletters
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You can also get your newsletters from other email clients to
              Rainbox by setting up forwarding rules.
            </p>
            <div className="space-y-2">
              <a
                href="#"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Image
                  src="/YoutubeLogo.png"
                  alt="YouTube Logo"
                  width={24}
                  height={24}
                  className="w-5 h-5"
                />
                <span className="text-sm">Forwarding from Gmail</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Image
                  src="/YoutubeLogo.png"
                  alt="YouTube Logo"
                  width={24}
                  height={24}
                  className="w-5 h-5"
                />
                <span className="text-sm">Forwarding from Outlook</span>
              </a>
            </div>
          </div>
        </div>

        <AddMailBox
          showAddMailbox={showAddMailbox}
          handleCloseModal={handleCloseModals}
          username={username}
          setUsername={setUsername}
        />

        <DisconnectBox
          showDisconnectBox={!!showDisconnectModal.service}
          handleCloseModal={handleCloseModals}
          serviceName={showDisconnectModal.service || ""}
          handleDisconnect={handleDisconnect}
          isDisconnecting={isDisconnecting}
        />
      </div>

      <GmailConnectionFlow
        isOpen={isGmailFlowOpen}
        onClose={() => setIsGmailFlowOpen(false)}
        onConnectionComplete={() => setIsGmailFlowOpen(false)}
      />

      <OutlookConnectionFlow
        isOpen={isOutlookFlowOpen}
        onClose={() => setIsOutlookFlowOpen(false)}
        onConnectionComplete={() => setIsOutlookFlowOpen(false)}
      />
    </>
  );
}