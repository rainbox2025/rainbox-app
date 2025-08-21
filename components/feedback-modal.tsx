import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChatBubbleOvalLeftIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useSettings } from "@/context/settingsContext"; // Import the context hook

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const feedbackCategories = [
  { name: "Issues", icon: ExclamationTriangleIcon },
  { name: "Suggestions", icon: LightBulbIcon },
  { name: "Other", icon: ChatBubbleOvalLeftIcon },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { submitFeedback } = useSettings(); // Use the context function
  const [selectedCategory, setSelectedCategory] = useState<string>(
    feedbackCategories[0].name
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCategory(feedbackCategories[0].name);
      setMessage("");
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    const fullFeedback = `${selectedCategory}: ${message}`;

    try {
      await submitFeedback(message, selectedCategory);
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      // Optionally, show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 w-screen z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-content rounded-lg shadow-xl w-full max-w-md border border-border"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Share Feedback
                </h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
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
                      onClick={() =>
                        !isLoading && setSelectedCategory(category.name)
                      }
                      disabled={isLoading}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-secondary border-ring text-secondary-foreground"
                          : "bg-content border-border text-muted-foreground hover:bg-hovered"
                      } ${isLoading ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      <IconComponent className="h-6 w-6 mb-1.5" />
                      <span className="text-xs font-medium">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>

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
                  className="w-full p-3 border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground placeholder-muted-foreground resize-none"
                  disabled={isLoading}
                />
              </div>

              <div className="mt-6">
                <button
                  className="w-full bg-primary text-primary-foreground h-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={isLoading || !message.trim()}
                >
                  {isLoading ? (
                    <ArrowPathIcon className="animate-spin h-5 w-5" />
                  ) : (
                    "Submit Feedback"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
