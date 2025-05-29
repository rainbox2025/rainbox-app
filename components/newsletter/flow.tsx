import React, { useState, useEffect } from 'react';
import { AddNewsletterModal } from './add-newsletter-modal';
import { SelectNewslettersModal } from './select-newsletters-modal';
import { SuccessModal } from '../modals/succeed-modal';
import { ErrorModal } from '../modals/error-modal';
import { MOCK_CONNECTIONS, MOCK_SUGGESTED_SENDERS } from './mock-newsletter-data';
import { Connection, Sender } from '@/types/data';

export const AddNewsletterFlow = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  type ModalType = 'addNewsletter' | 'selectNewsletters' | 'success' | 'error' | null;
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const [connections, setConnections] = useState<Connection[]>([]);
  const [suggestedSenders, setSuggestedSenders] = useState<Sender[]>([]);
  const [currentConnectedAccount, setCurrentConnectedAccount] = useState<{ email: string, name: string } | null>(null);


  useEffect(() => {
    setConnections(MOCK_CONNECTIONS);
    setSuggestedSenders(MOCK_SUGGESTED_SENDERS);
  }, []);

  useEffect(() => {
    if (isOpen) {
      openFlow();
    }
    else {
      closeModal();
    }
  }, [isOpen])

  const openFlow = () => setActiveModal('addNewsletter');
  const closeModal = () => {
    setActiveModal(null);
    onClose();
  };

  const handleSelectSender = (email: string, accountName: string) => {
    setCurrentConnectedAccount({ email, name: accountName });
    setActiveModal('selectNewsletters');
  };

  const handleBackToConnections = () => {
    setActiveModal('addNewsletter');
  };

  const handleAddNewsletters = (selected: Sender[]) => {
    console.log('Selected newsletters to add:', selected);

    const isSuccess = Math.random() > 0.3; // Simulate success or failure
    if (isSuccess) {
      setActiveModal('success');
    } else {
      setActiveModal('error');
    }
  };

  const handleTryAgainError = () => {

    if (currentConnectedAccount) {
      setActiveModal('selectNewsletters');
    } else {
      setActiveModal('addNewsletter');
    }
  };

  return (
    <div>
      <AddNewsletterModal
        isOpen={activeModal === 'addNewsletter'}
        onClose={closeModal}
        connections={connections}
        onSelectSender={handleSelectSender}
      />

      <SelectNewslettersModal
        isOpen={activeModal === 'selectNewsletters'}
        onClose={closeModal}
        onBack={handleBackToConnections}
        onAddNewsletters={handleAddNewsletters}
        suggestedSenders={suggestedSenders}
        connectedAccountName={currentConnectedAccount?.name}
      />

      <SuccessModal
        isOpen={activeModal === 'success'}
        onClose={closeModal}
        onSelectNewsletters={() => setActiveModal('selectNewsletters')}
        mainText='Woohoo! Selected Newsletters are getting added. It may take upto 2 minutes to show up in your feed'
        buttonText='Close'
      />

      <ErrorModal
        isOpen={activeModal === 'error'}
        onClose={closeModal}
        onTryAgain={handleTryAgainError}
        mainText='Oops! There was an error. Please try again, or re-sync your email account. If nothing works, contact support.'
      />
    </div>
  );
};