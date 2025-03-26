import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isInput?: boolean;
  showUnfollowOption?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  isInput = false,
  description,
  confirmText = 'Confirm',
  showUnfollowOption = false
}) => {
  const [isUnfollowChecked, setIsUnfollowChecked] = React.useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {description}
            </p>

            {showUnfollowOption && (
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isUnfollowChecked}
                    onChange={() => setIsUnfollowChecked(!isUnfollowChecked)}
                    className="form-checkbox h-4 w-4 text-blue-600 
                               bg-gray-100 border-gray-300 rounded 
                               dark:bg-gray-700 dark:border-gray-600 
                               dark:checked:bg-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    Unfollow all feeds
                  </span>
                </label>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 
                           hover:bg-gray-100 dark:hover:bg-gray-700 
                           rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-500 text-white 
                           rounded-md hover:bg-red-600 
                           transition-colors"
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};