
import React, { useState, useEffect } from 'react';
import { ConnectGmailModal } from './connect-gmail';
import { GmailPermissionsModal } from './proceed-modal';
import { ErrorModal } from '../modals/error-modal';
import { SuccessModal } from '../modals/succeed-modal';
import { useGmail } from '@/context/gmailContext';


type ActiveGmailSubModalType = 'connect' | 'permissions' | 'success' | 'error' | null;



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
  const { email, isConnected, connectGmail } = useGmail();



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

  const handleGmailApiConnection = async () => {
    connectGmail();
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
        <SuccessModal
          isOpen={true}
          onClose={handleSubModalClose}
          onSelectNewsletters={handleSelectNewsletters}
          mainText='Woohoo! Your Gmail is now connected to Rainbox'
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