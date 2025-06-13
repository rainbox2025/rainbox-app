// connect-outlook/index.tsx

import React, { useState, useEffect } from 'react';
import { ConnectOutlookModal } from './connect-outlook';
import { OutlookPermissionsModal } from './proceed-modal';
import { ErrorModal } from '../modals/error-modal';
import { SuccessModal } from '../modals/succeed-modal';
import { useOutlook } from '@/context/outlookContext'; // <-- Use Outlook context

type ActiveOutlookSubModalType = 'connect' | 'permissions' | 'success' | 'error' | null;

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
  const [activeSubModal, setActiveSubModal] = useState<ActiveOutlookSubModalType>(null);
  const { email, isConnected, connectOutlook } = useOutlook(); // <-- Use Outlook hooks

  useEffect(() => {
    if (isOpen) {
      setActiveSubModal('connect');
    } else {
      setActiveSubModal(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isConnected && email) {
      setActiveSubModal('success');
    }
  }, [isOpen, isConnected, email]);

  if (!isOpen || !activeSubModal) {
    return null;
  }

  const handleCloseSubModalAndFlow = () => {
    setActiveSubModal(null);
    onClose();
  };

  const proceedToPermissions = () => {
    setActiveSubModal('permissions');
  };

  const handleOutlookApiConnection = async () => {
    connectOutlook(); // <-- Call Outlook connection function
  };

  const handlePermissionSuccess = () => {
    setActiveSubModal('success');
  };

  const handlePermissionError = () => {
    setActiveSubModal('error');
  };

  const handleSelectNewsletters = () => {
    console.log("Navigate to select newsletters action...");
    if (onConnectionComplete) {
      onConnectionComplete();
    }
    handleCloseSubModalAndFlow();
  };

  const handleTryAgainError = () => {
    setActiveSubModal('permissions');
  };

  const handleSubModalClose = () => {
    handleCloseSubModalAndFlow();
  }

  return (
    <>
      {activeSubModal === 'connect' && (
        <ConnectOutlookModal
          isOpen={true}
          onClose={handleSubModalClose}
          onProceedToPermissions={proceedToPermissions}
        />
      )}

      {activeSubModal === 'permissions' && (
        <OutlookPermissionsModal
          isOpen={true}
          onClose={handleSubModalClose}
          handleConnection={handleOutlookApiConnection}
          onSuccess={handlePermissionSuccess}
          onError={handlePermissionError}
        />
      )}

      {activeSubModal === 'success' && (
        <SuccessModal
          isOpen={true}
          onClose={handleSubModalClose}
          onSelectNewsletters={handleSelectNewsletters}
          mainText='Woohoo! Your Outlook is now connected to Rainbox' // <-- Changed text
          buttonText='Select Newsletters'
        />
      )}

      {activeSubModal === 'error' && (
        <ErrorModal
          isOpen={true}
          onClose={handleSubModalClose}
          onTryAgain={handleTryAgainError}
          mainText=' Oops! There was an error. Try again or contact support.'
        />
      )}
    </>
  );
};