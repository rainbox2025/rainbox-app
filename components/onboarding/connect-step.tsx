"use client";

import React from "react";
import ConnectionCard from "@/components/settings/ConnectionCard";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboardingContext";
import { useGmail } from "@/context/gmailContext";
import { useOutlook } from "@/context/outlookContext";

export const ConnectStep = () => {
  const { nextStep, previousStep } = useOnboarding();
  const { isConnected: isGmailConnected, email: gmailEmail, connectGmail } = useGmail();
  const { isConnected: isOutlookConnected, email: outlookEmail, connectOutlook } = useOutlook();

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-md font-medium text-foreground">Bring your existing newsletters</h2>
      <p className="text-xs text-muted-foreground mt-2">
        Sign in to Gmail or Outlook to sync your newsletters. All existing and future emails from selected senders will appear in Rainbox.
      </p>
      <div className="space-y-3 mt-6">
        <ConnectionCard
          logo="/gmail.webp"
          logoAlt="Gmail Logo"
          title={isGmailConnected ? "Gmail Connected" : "Connect your Gmail"}
          subtitle={isGmailConnected ? gmailEmail : "No account connected"}
          actionType={isGmailConnected ? "disconnect" : "connect"}
          onAction={connectGmail}
          isConnected={isGmailConnected}
        />
        <ConnectionCard
          logo="/OutlookLogo.png"
          logoAlt="Outlook Logo"
          title={isOutlookConnected ? "Outlook Connected" : "Connect your Outlook"}
          subtitle={isOutlookConnected ? outlookEmail : "No account connected"}
          actionType={isOutlookConnected ? "disconnect" : "connect"}
          onAction={connectOutlook}
          isConnected={isOutlookConnected}
        />
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <Button variant="ghost" onClick={previousStep} size="sm">← Back</Button>
        <Button onClick={nextStep} size="sm">Do it later →</Button>
      </div>
    </div>
  );
};