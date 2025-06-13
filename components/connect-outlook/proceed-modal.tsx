// connect-outlook/proceed-modal.tsx

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { OutlookRainboxLogosDisplay } from './outlook-rainbox-logo'; // <-- Use Outlook logo display
import { ModalCloseButton } from '../modals/modal-close-button';
import { Button } from '../ui/button';
import { Loader } from 'lucide-react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { useOutlook } from '@/context/outlookContext'; // <-- Use Outlook context

interface OutlookPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleConnection: () => void;
  onSuccess: () => void;
  onError: () => void;
}

export const OutlookPermissionsModal: React.FC<OutlookPermissionsModalProps> = ({
  isOpen,
  onClose,
  handleConnection,
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { email, isConnected } = useOutlook(); // <-- Use Outlook hook
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  if (!isOpen) return null;

  useEffect(() => {
    if (isOpen && isConnected && email) {
      setResult('success');
    }
  }, [isOpen, isConnected, email]);

  const onProceedClick = async () => {
    setIsLoading(true);
    try {
      handleConnection();
      // The success/error handling remains the same as it's driven by parent state
      if (result === 'success') {
        onSuccess();
      }
      if (result === 'error') {
        onError();
      }
    } catch (err) {
      console.error("Connection error:", err);
      onError();
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
          className="bg-content rounded-xl shadow-xl w-full max-w-[400px] border border-secondary"
        >
          <div className="p-6">
            <div className="flex justify-end items-center mb-1">
              <ModalCloseButton onClick={onClose} disabled={isLoading} />
            </div>

            <OutlookRainboxLogosDisplay /> {/* <-- Use Outlook logo display */}

            <div className="text-center my-5">
              <div className="flex items-center justify-center mb-2">
                <LockClosedIcon className="h-4 w-4 mr-1.5" />
                <h2 className="text-sm font-semibold">Your emails and data are private</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We need some additional permissions to sync your newsletters to Rainbox. We only access the newsletters you choose. We never share your data and you can disconnect anytime.
              </p>
            </div>

            <Button className='w-full text-sm' onClick={onProceedClick}>
              Proceed
              {isLoading ? <Loader className="animate-spin ml-2" /> : <ArrowRightIcon className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};