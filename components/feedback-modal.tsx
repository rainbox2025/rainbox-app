import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChatBubbleOvalLeftIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const feedbackCategories = [
  { name: 'Issues', icon: ExclamationTriangleIcon },
  { name: 'Suggestions', icon: LightBulbIcon },
  { name: 'Other', icon: ChatBubbleOvalLeftIcon },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    feedbackCategories[0].name
  );
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(feedbackCategories[0].name);
      setMessage('');
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (message.trim() && !isLoading) {
      setIsLoading(true);
      try {

        onClose();
      } catch (error) {
        console.error('Error submitting feedback:', error);

      } finally {
        setIsLoading(false);
      }
    } else if (!message.trim()) {

      textareaRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm w-[100vw] px-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-content rounded-lg shadow-xl w-full max-w-md border border-gray-100/80 dark:border-neutral-700"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                Share Feedback
              </h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
                aria-label="Close modal"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {feedbackCategories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.name;
                return (
                  <button
                    key={category.name}
                    onClick={() => !isLoading && setSelectedCategory(category.name)}
                    disabled={isLoading}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-lg border
                      transition-all duration-150 ease-in-out
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-content
                      ${isSelected
                        ?
                        'bg-primary-foreground  border-slate-500  shadow-sm'
                        :
                        'bg-primary-foreground/80  hover:bg-slate-50 dark:hover:bg-slate-700/70 hover:border-slate-400 dark:hover:border-slate-500'
                      }
                      ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                    `}
                  >
                    <IconComponent
                      className={`h-6 w-6 mb-1.5 ${isSelected
                        ? 'text-sm'
                        : 'text-muted-foreground'
                        }`}
                    />
                    <span
                      className={`text-xs font-medium ${isSelected
                        ? 'text-sm'
                        : 'text-muted-foreground'
                        }`}
                    >
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Message Textarea Section */}
            <div>
              <label
                htmlFor="feedback-message"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Your message
              </label>
              <textarea
                id="feedback-message"
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={4}

                className="w-full p-3 border border-border dark:border-neutral-600 rounded-md 
                           bg-content dark:bg-content
                           focus:outline-none focus:ring-2 focus:ring-ring 
                           text-sm text-foreground placeholder-muted-foreground
                           resize-none"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && !isLoading) onClose();

                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isLoading) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                className={`
                  w-full px-4 py-2.5 rounded-md transition-colors text-sm font-semibold
                  flex items-center justify-center relative
                  bg-primary hover:bg-primary/80 text-primary-foreground 
                  dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-slate-50
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="opacity-0">Submit</span> {/* Maintain width */}
                    <span className="absolute inset-0 flex items-center justify-center">
                      <ArrowPathIcon className="animate-spin h-5 w-5" />
                    </span>
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};