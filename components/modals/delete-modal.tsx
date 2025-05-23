import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  itemName: string;
  itemType: 'folder' | 'sender' | 'markasread' | 'markasunread';
  showUnfollowOption?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  showUnfollowOption
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUnfollowChecked, setIsUnfollowChecked] = React.useState(false);

  if (!isOpen) return null;

  // Define modal content based on itemType
  const getModalContent = () => {
    switch (itemType) {
      case 'folder':
        return {
          title: "Delete Folder",
          description: `Are you sure you want to delete "${itemName}"? This operation cannot be undone.`,
          confirmText: "Delete Folder",
          confirmClass: "bg-destructive text-destructive-foreground hover:bg-destructive/80"
        };
      case 'sender':
        return {
          title: "Unfollow Feed",
          description: `Are you sure you want to unfollow "${itemName}"? This feed and it's content will be deleted. This action cannot be undone.`,
          confirmText: "Unfollow Feed",
          confirmClass: "bg-destructive text-destructive-foreground hover:bg-destructive/80"
        };
      case 'markasread':
        return {
          title: "Mark as Read",
          description: `Are you sure you want to mark all posts in "${itemName}" as Read?`,
          confirmText: "Mark as Read",
          confirmClass: "bg-primary text-primary-foreground hover:bg-primary/80"
        };
      case 'markasunread':
        return {
          title: "Mark as Unread",
          description: `Are you sure you want to mark all posts in "${itemName}" as Unread?`,
          confirmText: "Mark as Unread",
          confirmClass: "bg-primary text-primary-foreground hover:bg-primary/80"
        };
      default:
        return {
          title: "Confirm Action",
          description: `Are you sure you want to proceed with this action?`,
          confirmText: "Confirm",
          confirmClass: "bg-destructive text-destructive-foreground hover:bg-destructive/80"
        };
    }
  };

  const { title, description, confirmText, confirmClass } = getModalContent();

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error confirming action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm w-[100vw]">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-content  rounded-lg shadow-xl w-full max-w-sm mx-4 border border-gray-100/80"
        >
          <div className="p-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-secondary-foreground"
                disabled={isLoading}
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

            <p className="text-sm mb-4">{description}</p>

            {showUnfollowOption && (
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isUnfollowChecked}
                    onChange={() => setIsUnfollowChecked(!isUnfollowChecked)}
                    className="form-checkbox h-3 w-3 text-blue-600 
                               bg-gray-100 border-gray-300 rounded 
                               dark:bg-gray-700 dark:border-gray-600 
                               dark:checked:bg-blue-500"
                  />
                  <span className="ml-2 text-muted-foreground text-sm cursor-pointer">
                    Unfollow all feeds
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors text-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 ${confirmClass} rounded-md transition-colors text-sm relative`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="opacity-0">{confirmText}</span>
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <ArrowPathIcon className="animate-spin h-4 w-4 text-sm" />
                    </span>
                  </>
                ) : confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};