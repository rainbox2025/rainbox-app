"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react'; // Import Loader2
import React from 'react';

interface DisconnectBoxProps {
  showDisconnectBox: boolean;
  handleCloseModal: () => void;
  serviceName: 'gmail' | 'outlook' | string;
  handleDisconnect: () => void;
  isDisconnecting: boolean; // Add this prop
}

export default function DisconnectBox({
  showDisconnectBox,
  handleCloseModal,
  serviceName,
  handleDisconnect,
  isDisconnecting // Receive the prop
}: DisconnectBoxProps) {

  const capitalizedServiceName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);

  return (
    <AnimatePresence>
      {showDisconnectBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm !mt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-content rounded-lg shadow-xl w-full max-w-sm mx-4 border border-border"
          >
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <div className='flex flex-col gap-1'>
                  <h2 className="text-sm font-semibold">
                    Are you sure you want to disconnect {capitalizedServiceName}?
                  </h2>
                  <p className="mb-2 text-xs text-muted-foreground">
                    You'll no longer receive any future emails from your {capitalizedServiceName} account.
                  </p>
                </div>

                <button
                  onClick={handleCloseModal}
                  disabled={isDisconnecting} // Disable close button while loading
                  className="p-1 rounded-full text-muted-foreground hover:bg-hovered transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={handleCloseModal}
                  disabled={isDisconnecting} // Disable button while loading
                  className="px-4 py-2 text-muted-foreground hover:bg-hovered rounded-md transition-colors text-sm disabled:opacity-50"
                >
                  Go back
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting} // Disable button while loading
                  className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition-colors text-sm relative flex items-center justify-center w-28 disabled:opacity-75"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm">Disconnect</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}