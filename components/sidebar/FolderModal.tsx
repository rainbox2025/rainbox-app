import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folderName: string) => void;
  initialName?: string;
  title: string;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  title
}) => {
  const [folderName, setFolderName] = React.useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFolderName(initialName);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialName]);

  const handleSave = () => {
    if (folderName.trim()) {
      onSave(folderName.trim());
      onClose();
    }
  };

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
                {title}
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

            <input
              ref={inputRef}
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder Name"
              className="w-full px-3 py-2 border border-border dark:border-border rounded-md 
                         bg-background dark:bg-background 
                         text-foreground 
                         focus:outline-none focus:ring-2 focus:ring-ring"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onClose();
              }}
            />

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-muted-foreground 
                           hover:bg-accent 
                           rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!folderName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground 
                           rounded-md hover:bg-primary/80 
                           disabled:opacity-50 disabled:cursor-not-allowed 
                           transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};