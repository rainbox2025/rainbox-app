import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ModalCloseButton } from './modal-close-button';
import { Button } from '../ui/button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface GmailSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNewsletters: () => void;
}

export const GmailSuccessModal: React.FC<GmailSuccessModalProps> = ({ isOpen, onClose, onSelectNewsletters }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-[400px] border border-neutral-200"
        >
          <div className="p-6">
            <div className="flex justify-end items-center mb-4">
              <ModalCloseButton onClick={onClose} />
            </div>

            <div className="text-center my-6">
              <CheckCircleIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-md font-semibold text-neutral-800 mb-2">
                Woohoo! Your Gmail is now connected to Rainbox
              </h2>
            </div>

            <Button className='w-full text-sm' onClick={onSelectNewsletters}>
              Select Newsletters
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};