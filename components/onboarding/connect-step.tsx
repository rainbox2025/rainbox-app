// src/components/onboarding/connect-step.tsx
"use client";

import React from "react";
import ConnectionCard from "@/components/settings/ConnectionCard";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboardingContext";
import { useGmail } from "@/context/gmailContext";
import { useOutlook } from "@/context/outlookContext";
import { Loader2 } from "lucide-react";

interface ConnectStepProps {
  onConnect: (service: 'gmail' | 'outlook') => void;
  onSelectSenders: (service: 'Gmail' | 'Outlook') => void;
}

export const ConnectStep: React.FC<ConnectStepProps> = ({ onConnect, onSelectSenders }) => {
  const { nextStep, previousStep } = useOnboarding();
  const { isConnected: isGmailConnected, email: gmailEmail, isLoading: isGmailLoading } = useGmail();
  const { isConnected: isOutlookConnected, email: outlookEmail, isLoading: isOutlookLoading } = useOutlook();

  const isLoading = isGmailLoading || isOutlookLoading;

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-md font-medium text-foreground">Bring your existing newsletters</h2>
      <p className="text-xs text-muted-foreground mt-2">
        Sign in to Gmail or Outlook to sync your newsletters. All existing and future emails from selected senders will appear in Rainbox.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 mt-6">
          <ConnectionCard
            logo="/gmail.webp"
            logoAlt="Gmail Logo"
            title={isGmailConnected ? "Gmail" : "Connect your Gmail"}
            subtitle={isGmailConnected ? gmailEmail : "No account connected"}
            actionType={isGmailConnected ? "select-sender" : "connect"}
            onAction={() => {
              if (isGmailConnected) onSelectSenders('Gmail');
              else onConnect('gmail');
            }}
            isConnected={isGmailConnected}
          />
          <ConnectionCard
            logo="/OutlookLogo.png"
            logoAlt="Outlook Logo"
            title={isOutlookConnected ? "Outlook" : "Connect your Outlook"}
            subtitle={isOutlookConnected ? outlookEmail : "No account connected"}
            actionType={isOutlookConnected ? "select-sender" : "connect"}
            onAction={() => {
              if (isOutlookConnected) onSelectSenders('Outlook');
              else onConnect('outlook');
            }}
            isConnected={isOutlookConnected}
          />
        </div>
      )}

      <div className="flex justify-end space-x-2 mt-6">
        <Button variant="ghost" onClick={previousStep} size="sm">← Back</Button>
        <Button onClick={nextStep} size="sm">{
          isGmailConnected || isOutlookConnected ? "Next →" : "Do it later →"
        }</Button>
      </div>
    </div>
  );
};