import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Feed, Category } from '@/types/data';

interface FeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  feed: Feed | null;
  categories: Category[];
  onSave: (updatedFeed: Feed) => void;
}

export const FeedModal: React.FC<FeedModalProps> = ({
  isOpen,
  onClose,
  feed,
  categories,
  onSave
}) => {
  const [feedName, setFeedName] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && feed) {
      setFeedName(feed.name);
      setSelectedCategory(feed.category || '');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, feed]);

  const handleSave = () => {
    if (feed && feedName.trim()) {
      const updatedFeed: Feed = {
        ...feed,
        name: feedName.trim(),
        category: selectedCategory || ''
      };
      onSave(updatedFeed);
      onClose();
    }
  };

  if (!isOpen || !feed) return null;

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
                Edit Feed
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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sender
              </label>
              <input
                type="text"
                value={feed.name}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-gray-100 dark:bg-gray-700 
                           text-gray-600 dark:text-gray-300 
                           cursor-not-allowed"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feed Icon and Title
              </label>
              <input
                ref={inputRef}
                type="text"
                value={feedName}
                onChange={(e) => setFeedName(e.target.value)}
                placeholder="Feed Name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 
                           text-gray-900 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') onClose();
                }}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-700 
                           text-gray-900 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">No Folder</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

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
                onClick={handleSave}
                disabled={!feedName.trim()}
                className="px-4 py-2 bg-blue-500 text-white 
                           rounded-md hover:bg-blue-600 
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