// src/components/newsletter/flow.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { AddNewsletterModal } from './add-newsletter-modal';
import { SelectNewslettersModal } from './select-newsletters-modal';
import { SuccessModal } from '../modals/succeed-modal';
import { ErrorModal } from '../modals/error-modal';
import { Sender } from '@/context/gmailContext'; // Import the correct Sender type
import { useSenders } from '@/context/sendersContext';

export const AddNewsletterFlow = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  type ModalType = 'addNewsletter' | 'selectNewsletters' | 'success' | 'error' | null;
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [currentConnectedAccount, setCurrentConnectedAccount] = useState<{ email: string, name: string } | null>(null);
  const { fetchSenders } = useSenders();

  useEffect(() => {
    if (isOpen) {
      openFlow();
    } else {
      closeModal();
    }
  }, [isOpen]);

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
    setCurrentConnectedAccount(null);
    setActiveModal('addNewsletter');
  };

  // This is now called AFTER the SelectNewslettersModal has successfully
  // saved and onboarded the senders via the context.
  const handleAddNewsletters = async (selected: Sender[]) => {
    await fetchSenders();
    console.log(`${selected.length} newsletters successfully onboarded.`);
    setActiveModal('success');
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
      {/* 
        This modal now uses context internally to get connection status.
        The `connections` prop is no longer needed.
      */}
      <AddNewsletterModal
        isOpen={activeModal === 'addNewsletter'}
        onClose={closeModal}
        onSelectSender={handleSelectSender}
      />

      {/* 
        This modal is now self-sufficient using the GmailContext.
        The `suggestedSenders` prop has been removed.
      */}
      <SelectNewslettersModal
        isOpen={activeModal === 'selectNewsletters'}
        onClose={closeModal}
        onBack={handleBackToConnections}
        onAddNewsletters={handleAddNewsletters}
        connectedAccountName={currentConnectedAccount?.name}
      />

      <SuccessModal
        isOpen={activeModal === 'success'}
        onClose={closeModal}
        mainText='Woohoo! Selected Newsletters are successfully added to your feed.'
        buttonText='Done'
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