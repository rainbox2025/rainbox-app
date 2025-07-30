// src/components/onboarding/flow.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useOnboarding } from "@/context/onboardingContext";
import { UsernameStep } from "./username-step";
import { TopicsStep } from "./topics-step";
import { ConnectStep } from "./connect-step";
import { GetAppStep } from "./get-app-step";
import { CompleteStep } from "./complete-step";
import { GmailConnectionFlow } from "../connect-gmail/flow";
import { OutlookConnectionFlow } from "../connect-outlook/flow";
import { SelectNewslettersModal } from "../newsletter/select-newsletters-modal";
import { SuccessModal } from "../modals/succeed-modal";
import { Sender } from "@/context/gmailContext";
import { useSenders } from "@/context/sendersContext";

type SubFlow = 'none' | 'gmail_connect' | 'outlook_connect' | 'select_senders' | 'select_success';

export const OnboardingFlow = () => {
  const { currentStep, isOnboardingComplete, goToStep } = useOnboarding();
  const { fetchSenders: refreshAppSenders } = useSenders();
  const [modalState, setModalState] = useState<'loading' | 'open' | 'closed'>('loading');
  const [activeSubFlow, setActiveSubFlow] = useState<SubFlow>('none');
  const [serviceForSelection, setServiceForSelection] = useState<'Gmail' | 'Outlook' | null>(null);

  useEffect(() => {
    // For testing purpose: skip TopicsStep (2) and GetAppStep (4)
    if (currentStep === 2) {
      goToStep(3);
    } else if (currentStep === 4) {
      goToStep(5);
    }
  }, [currentStep, goToStep]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const isComplete = await isOnboardingComplete();
        if (!isComplete) {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('gmail_connected') || urlParams.has('outlook_connected')) {
            goToStep(3);
          }
        }
        setModalState(isComplete ? 'closed' : 'open');
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        setModalState('closed');
      }
    };
    checkStatus();
  }, [isOnboardingComplete, goToStep]);

  const handleStartConnect = (service: 'gmail' | 'outlook') => {
    setActiveSubFlow(service === 'gmail' ? 'gmail_connect' : 'outlook_connect');
  };

  const handleStartSelectSenders = (service: 'Gmail' | 'Outlook') => {
    setServiceForSelection(service);
    setActiveSubFlow('select_senders');
  };

  const handleSubFlowClose = () => {
    setActiveSubFlow('none');
  };

  const handleAddNewsletters = async (selected: Sender[]) => {
    await refreshAppSenders();
    setActiveSubFlow('select_success');
  };

  if (modalState === 'loading' || modalState === 'closed') {
    return null;
  }


  switch (activeSubFlow) {
    case 'gmail_connect':
      return <GmailConnectionFlow isOpen={true} onClose={handleSubFlowClose} onConnectionComplete={handleSubFlowClose} />;

    case 'outlook_connect':
      return <OutlookConnectionFlow isOpen={true} onClose={handleSubFlowClose} onConnectionComplete={handleSubFlowClose} />;

    case 'select_senders':
      return (
        <SelectNewslettersModal
          isOpen={true}
          onClose={handleSubFlowClose}
          onBack={handleSubFlowClose}
          onAddNewsletters={handleAddNewsletters}
          connectedAccountName={serviceForSelection || undefined}
        />
      );

    case 'select_success':
      return (
        <SuccessModal
          isOpen={true}
          onClose={handleSubFlowClose}
          mainText='Woohoo! Selected Newsletters are successfully added to your feed.'
          buttonText='Continue Onboarding'
        />
      );

    case 'none':
    default:
      const renderProgressBar = () => (
        <>
          <div className="w-[99%] mb-5 bg-gray-200 dark:bg-gray-700 h-2 rounded-full ">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 "
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
          <div className="border-b border-border"></div>
        </>
      );

      const renderStepContent = () => {
        switch (currentStep) {
          case 1: return <UsernameStep />;
          case 2: return <TopicsStep />;
          case 3: return <ConnectStep onConnect={handleStartConnect} onSelectSenders={handleStartSelectSenders} />;
          case 4: return <GetAppStep />;
          case 5: return <CompleteStep />;
          default: return <UsernameStep />;
        }
      };

      return (
        <Dialog open={modalState === 'open'}>
          <DialogContent
            className="sm:max-w-sm bg-content h-[70vh] rounded-lg shadow-xl border border-border p-0 overflow-hidden [&>button]:hidden"
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
          >
            <DialogHeader className="p-6 pb-0 ">
              {renderProgressBar()}
            </DialogHeader>
            {renderStepContent()}
          </DialogContent>
        </Dialog>
      );
  }
};