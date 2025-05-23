
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from './icons';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  widthClass?: string;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  widthClass = 'max-w-[440px]',
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed w-screen inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-content rounded-xl shadow-xl w-full ${widthClass} border border-secondary overflow-hidden flex flex-col`}
          >
            {title && (
              <div className="flex justify-between items-center p-md border-b border-secondary">
                <h2 className="text-lg font-semibold te">{title}</h2>
                <button
                  onClick={onClose}
                  className=""
                  aria-label="Close modal"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>
            )}
            {!title && (
              <button
                onClick={onClose}
                className="absolute top-5 right-5  z-10"
                aria-label="Close modal"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            )}
            <div className="p-6  flex-grow overflow-y-auto">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};