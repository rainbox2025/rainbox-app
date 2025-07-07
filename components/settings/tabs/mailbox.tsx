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
import { CopyCheckIcon, CopyIcon, Loader2, Trash2Icon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { config } from "@/config";
import { Button } from "@/components/ui/button";
import { enqueueSnackbar } from "notistack";
import { AnimatePresence, motion } from "framer-motion";
export default function MailboxTab() {
  const {
    isConnected: isGmailConnected,
    email: gmailEmail,
    isLoading: isGmailLoading,
    disconnectGmail,
  } = useGmail();
  const { user, deleteSecondaryEmail, setSecondaryEmails } = useAuth();
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
  const [copied, setCopied] = useState(false);
  // --- ADD THIS STATE ---
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // State for AddMailBox modal
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const { secondaryEmails } = useAuth();

  const handleCreateMailbox = () => {
    if (!username || !fullName) {
      setError("Please fill in all required fields.");
      return;
    }
    setShowAddMailbox(false);
    setError("");
  };

  // --- UPDATE THIS FUNCTION ---
  const handleDisconnect = async () => {
    setIsDisconnecting(true); // Set loading to true
    try {
      if (showDisconnectModal.service === "gmail") {
        await disconnectGmail();
      } else if (showDisconnectModal.service === "outlook") {
        await disconnectOutlook();
      }
    } catch (e) {
      console.error("Failed to disconnect:", e);
      // Optionally show an error toast
    } finally {
      setIsDisconnecting(false); // Reset loading state
      setShowDisconnectModal({ service: null }); // Close modal
    }
  };

  const handleCloseModals = () => {
    setShowAddMailbox(false);
    setShowDisconnectModal({ service: null });
    setError("");
  };
  const handleDeleteEmail = async (email: string) => {
    try {
      await deleteSecondaryEmail(email, user?.id ?? "");
      setSecondaryEmails(secondaryEmails.filter((e) => e != email));
      enqueueSnackbar({
        message: "Email deleted!",
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar({
        message: "Failed to delete Email",
        variant: "error",
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${user?.user_name || "user"}@rainbox.ai`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // hide after 1.5 sec
  };

  const isLoading = isGmailLoading || isOutlookLoading;

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
            <div className="relative">
              <ConnectionCard
                logo="/RainboxLogo.png"
                logoAlt="Rainbox Logo"
                title="Rainbox - Primary Email"
                subtitle={`${user?.user_name || "user"}@rainbox.ai`}
                actionType="copy"
                onAction={handleCopy}
                isConnected={true}
              />
              <AnimatePresence>
                {copied && (
                  <motion.div
                    className="absolute top-full mt-2 right-4 bg-muted text-foreground px-2 py-1 rounded text-xs shadow z-10"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    Copied!
                  </motion.div>
                )}
              </AnimatePresence>
              {secondaryEmails.map((email) => {
                return (
                  <div className="flex justify-between border items-center rounded-md px-md py-sm mt-sm">
                    <div>{email.concat(`@${config.emailDomain ?? ""}`)} </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${user?.user_name || "user"}@rainbox.ai`
                          );
                          enqueueSnackbar({
                            message: "Copied!",
                            variant: "success",
                          });
                        }}
                        variant={"outline"}
                      >
                        <CopyIcon />
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeleteEmail(email);
                        }}
                        variant={"outline"}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
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
              {isLoading && !isDisconnecting ? ( // Show loader only for initial fetch
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

        {/* --- PASS THE LOADING STATE HERE --- */}
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
