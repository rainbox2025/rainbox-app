// src/components/connect-gmail/flow.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ConnectGmailModal } from './connect-gmail';
import { GmailPermissionsModal } from './proceed-modal';
import { ErrorModal } from '../modals/error-modal';
import { SuccessModal } from '../modals/succeed-modal';
import { useGmail } from '@/context/gmailContext';

type ActiveGmailSubModalType = 'connect' | 'permissions' | 'success' | 'error';

interface GmailConnectionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionComplete?: () => void;
}

export const GmailConnectionFlow: React.FC<GmailConnectionFlowProps> = ({
  isOpen,
  onClose,
  onConnectionComplete,
}) => {
  const [activeSubModal, setActiveSubModal] = useState<ActiveGmailSubModalType>('connect');
  const { connectGmail, connectionAttemptStatus, resetConnectionAttempt } = useGmail();

  useEffect(() => {
    if (isOpen) {
      if (connectionAttemptStatus === 'success') {
        setActiveSubModal('success');
      } else if (connectionAttemptStatus === 'error') {
        setActiveSubModal('error');
      } else {
        setActiveSubModal('connect');
      }
    }
  }, [isOpen, connectionAttemptStatus]);

  if (!isOpen) {
    return null;
  }

  const handleFlowClose = () => {
    resetConnectionAttempt();
    onClose();
  };

  const proceedToPermissions = () => {
    setActiveSubModal('permissions');
  };

  const handleGmailApiConnection = async () => {
    await connectGmail();
  };

  const handleSelectNewsletters = () => {
    if (onConnectionComplete) {
      onConnectionComplete();
    }
    handleFlowClose();
  };

  const handleTryAgain = () => {
    resetConnectionAttempt();
    setActiveSubModal('connect');
  };

  return (
    <>
      {activeSubModal === 'connect' && (
        <ConnectGmailModal
          isOpen={true}
          onClose={handleFlowClose}
          onProceedToPermissions={proceedToPermissions}
        />
      )}

      {activeSubModal === 'permissions' && (
        <GmailPermissionsModal
          isOpen={true}
          onClose={handleFlowClose}
          handleConnection={handleGmailApiConnection}
        />
      )}

      {activeSubModal === 'success' && (
        <SuccessModal
          isOpen={true}
          onClose={handleSelectNewsletters}
          mainText='Woohoo! Your Gmail is now connected to Rainbox'
          buttonText='Select Newsletters'
        />
      )}

      {activeSubModal === 'error' && (
        <ErrorModal
          isOpen={true}
          onClose={handleFlowClose}
          onTryAgain={handleTryAgain}
          mainText='Oops! There was an error. Try again or contact support.'
        />
      )}
    </>
  );
};