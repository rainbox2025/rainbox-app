"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboardingContext";
import { useGmail } from "@/context/gmailContext";
import ConnectionCard from "@/components/settings/ConnectionCard";

const primaryButtonClasses = "bg-primary text-primary-foreground hover:bg-primary/80";
const secondaryButtonClasses = "text-muted-foreground hover:bg-accent";

export const Step3Connections = () => {
  const { nextStep, previousStep } = useOnboarding(); // Use for navigation
  const {
    email: gmailEmail,
    isConnected: isGmailConnected,
    connectGmail,
    disconnectGmail,
    isLoading: isGmailLoading
  } = useGmail();

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-md font-medium text-foreground">Bring your existing newsletters</h2>
      <p className="text-xs text-muted-foreground mt-2">
        Connect Gmail or Outlook to import newsletters.
      </p>
      <div className="space-y-3 mt-6">
        <ConnectionCard
          logo="svg" // Your Google logo
          logoAlt="Google Logo"
          title={isGmailConnected && gmailEmail ? `Gmail Connected (${gmailEmail.substring(0, 15)}${gmailEmail.length > 15 ? '...' : ''})` : "Connect your Gmail"}
          subtitle={isGmailConnected ? "Ready to import." : "Sign in with Google."}
          actionType={isGmailConnected ? "disconnect" : "connect"}
          onAction={isGmailConnected ? disconnectGmail : connectGmail}
          isConnected={isGmailConnected}
          isLoading={isGmailLoading}
        />
        <ConnectionCard
          logo="/OutlookLogo.png"
          logoAlt="Outlook Logo"
          title="Connect your Outlook"
          subtitle="Sign in with Microsoft."
          actionType="connect"
          onAction={() => { alert("Outlook connection not implemented yet."); }}
          isConnected={false}
          isLoading={false}
        />
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <Button
          variant="ghost"
          onClick={previousStep}
          className={secondaryButtonClasses}
          size="sm"
        >
          ← Back
        </Button>
        <Button
          onClick={nextStep}
          className={primaryButtonClasses}
          size="sm"
        >
          {isGmailConnected ? "Next →" : "Do it later →"}
        </Button>
      </div>
    </div>
  );
};