import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: 'category' | 'feed';
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card dark:bg-card rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-100/80"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">
                {itemType === 'category' ? 'Delete Folder' : 'Unfollow Sender'}
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-secondary-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete "{itemName}"?
              This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground 
                           hover:bg-accent 
                           rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-destructive text-destructive-foreground 
                           rounded-md hover:bg-destructive/80 
                           transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};