
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightIcon, FaceFrownIcon } from '@heroicons/react/24/outline';
import { ModalCloseButton } from './modal-close-button';
import { Button } from '../ui/button';
import { Loader } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, onTryAgain }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleTryAgainClick = async () => {
    setIsLoading(true);


    try {
      await onTryAgain();
    } finally {
      setIsLoading(false);

    }
  };

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
              <ModalCloseButton onClick={onClose} disabled={isLoading} />
            </div>

            <div className="text-center my-6 flex flex-col items-center">
              <FaceFrownIcon className="h-16 w-16 text-neutral-700 mb-4" />
              <h2 className="text-md font-semibold text-neutral-800 mb-2">
                Oops! There was an error. <br /> Try again or contact support.
              </h2>
            </div>

            <Button className='w-full text-sm' onClick={handleTryAgainClick} >
              Try again
              {isLoading ? <Loader className="animate-spin ml-2" /> : <ArrowRightIcon className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};