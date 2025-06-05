
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
  mainText: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, onTryAgain, mainText }) => {
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
              <ModalCloseButton onClick={onClose} disabled={isLoading} />
            </div>

            <div className="text-center my-2 flex flex-col items-center">
              <FaceFrownIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-md   mb-2">
                {mainText}
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