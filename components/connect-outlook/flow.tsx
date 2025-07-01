// src/components/connect-outlook/flow.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ConnectOutlookModal } from './connect-outlook';
import { OutlookPermissionsModal } from './proceed-modal';
import { ErrorModal } from '../modals/error-modal';
import { SuccessModal } from '../modals/succeed-modal';
import { useOutlook } from '@/context/outlookContext';

type ActiveOutlookSubModalType = 'connect' | 'permissions' | 'success' | 'error';

interface OutlookConnectionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionComplete?: () => void;
}

export const OutlookConnectionFlow: React.FC<OutlookConnectionFlowProps> = ({
  isOpen,
  onClose,
  onConnectionComplete,
}) => {
  const [activeSubModal, setActiveSubModal] = useState<ActiveOutlookSubModalType>('connect');
  const { connectOutlook, connectionAttemptStatus, resetConnectionAttempt } = useOutlook();

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

  const handleOutlookApiConnection = async () => {
    await connectOutlook();
  };

  const handleSuccess = () => {
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
        <ConnectOutlookModal
          isOpen={true}
          onClose={handleFlowClose}
          onProceedToPermissions={proceedToPermissions}
        />
      )}

      {activeSubModal === 'permissions' && (
        <OutlookPermissionsModal
          isOpen={true}
          onClose={handleFlowClose}
          handleConnection={handleOutlookApiConnection}
        />
      )}

      {activeSubModal === 'success' && (
        <SuccessModal
          isOpen={true}
          onClose={handleSuccess}
          mainText='Woohoo! Your Outlook is now connected.'
          buttonText='Continue'
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