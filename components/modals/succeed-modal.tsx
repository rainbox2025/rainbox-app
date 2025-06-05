import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ModalCloseButton } from './modal-close-button';
import { Button } from '../ui/button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNewsletters?: () => void;
  mainText?: string;
  buttonText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, onSelectNewsletters, mainText, buttonText }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed w-screen inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-content rounded-xl shadow-xl w-full max-w-[350px] border border-hovered"
        >
          <div className="p-4">
            <div className="flex justify-end items-center mb-4">
              <ModalCloseButton onClick={onClose} />
            </div>

            <div className="text-center my-2">
              <CheckCircleIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-md  mb-2">
                {mainText}
              </h2>
            </div>

            <Button className='w-full bg-primary text-sm' onClick={onClose}>
              {buttonText}
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};