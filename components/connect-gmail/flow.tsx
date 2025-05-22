
import React, { useState, useEffect } from 'react';
import { ConnectGmailModal } from './connect-gmail';
import { GmailPermissionsModal } from './proceed-modal';
import { GmailSuccessModal } from './succeed-modal';
import { GmailErrorModal } from './error-modal';


type ActiveGmailSubModalType = 'connect' | 'permissions' | 'success' | 'error' | null;


const simulateGmailConnection = (): Promise<'success' | 'error'> => {
  return new Promise((resolve) => {
    console.log("Simulating Gmail connection API call...");
    setTimeout(() => {
      // const outcome = 'error';
      const outcome = 'success';
      console.log("Simulated Gmail connection result:", outcome);
      resolve(outcome);
    }, 1500);
  });
};

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
  const [activeSubModal, setActiveSubModal] = useState<ActiveGmailSubModalType>(null);


  useEffect(() => {
    if (isOpen) {
      setActiveSubModal('connect');
    } else {
      setActiveSubModal(null);
    }
  }, [isOpen]);

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

  const handleGmailApiConnection = async (): Promise<'success' | 'error'> => {
    const result = await simulateGmailConnection();
    return result;
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
        <ConnectGmailModal
          isOpen={true}
          onClose={handleSubModalClose}
          onProceedToPermissions={proceedToPermissions}
        />
      )}

      {activeSubModal === 'permissions' && (
        <GmailPermissionsModal
          isOpen={true}
          onClose={handleSubModalClose}
          handleConnection={handleGmailApiConnection}
          onSuccess={handlePermissionSuccess}
          onError={handlePermissionError}
        />
      )}

      {activeSubModal === 'success' && (
        <GmailSuccessModal
          isOpen={true}
          onClose={handleSubModalClose}
          onSelectNewsletters={handleSelectNewsletters}
        />
      )}

      {activeSubModal === 'error' && (
        <GmailErrorModal
          isOpen={true}
          onClose={handleSubModalClose}
          onTryAgain={handleTryAgainError}
        />
      )}
    </>
  );
};