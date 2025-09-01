import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExclamationTriangleIcon,
  LightBulbIcon,
  ChatBubbleOvalLeftIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BookOpenIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";
import { CameraIcon } from "@heroicons/react/24/solid";
import { useSettings } from "@/context/settingsContext";
import { BookOpen } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const feedbackCategories = [
  { name: "Issues", icon: ExclamationTriangleIcon },
  { name: "Suggestions", icon: LightBulbIcon },
  { name: "Other", icon: ChatBubbleOvalLeftIcon },
];

const MAX_SCREENSHOTS = 3;

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { submitFeedback } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    feedbackCategories[0].name
  );
  const [message, setMessage] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "success"
  >("idle");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    screenshotUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    screenshotUrlsRef.current = screenshots.map((file) =>
      URL.createObjectURL(file)
    );

    return () => {
      screenshotUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [screenshots]);

  const handleCloseAndReset = useCallback(() => {
    onClose();
    setTimeout(() => {
      setSelectedCategory(feedbackCategories[0].name);
      setMessage("");
      setScreenshots([]);
      setSubmissionStatus("idle");
      screenshotUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      screenshotUrlsRef.current = [];
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setScreenshots((prev) => [...prev, ...files].slice(0, MAX_SCREENSHOTS));
    }
    event.target.value = "";
  };

  const removeScreenshot = (indexToRemove: number) => {
    setScreenshots((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async () => {
    if (!message.trim() || submissionStatus === "submitting") return;

    setSubmissionStatus("submitting");

    const payload = {
      feedback: message,
      category: selectedCategory,
      screenshots: screenshotUrlsRef.current,
    };

    try {
      // Assuming submitFeedback in context is updated to accept a plain object
      await submitFeedback(payload as any);
      setSubmissionStatus("success");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSubmissionStatus("idle");
    }
  };

  const isLoading = submissionStatus === "submitting";

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 w-screen z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-content rounded-lg shadow-xl w-full max-w-md border border-border"
          >
            {submissionStatus === "success" ? (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="bg-blue-500 rounded-full h-16 w-16 flex items-center justify-center mb-6">
                  <CheckCircleIcon className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Thank you!!
                </h2>
                <p className="text-muted-foreground text-sm mb-8">
                  We greatly appreciate your support as we continue to improve.
                  We'll carefully review your feedback and add it to our
                  roadmap. Meanwhile, checkout the roadmap and latest updates
                </p>
                <div className="w-full space-y-3">
                  <button
                    onClick={() =>
                      window.open(
                        "https://rainbox.featurebase.app/changelog",
                        "_blank"
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 bg-hovered h-10 rounded-md text-sm font-medium border border-border hover:bg-secondary"
                  >
                    <NewspaperIcon className="h-5 w-5" />
                    Changelog
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        "https://rainbox.featurebase.app/help",
                        "_blank"
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 bg-hovered h-10 rounded-md text-sm font-medium border border-border hover:bg-secondary"
                  >
                    <BookOpen className="h-5 w-5" />
                    Help Center
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        "https://rainbox.featurebase.app/roadmap",
                        "_blank"
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 bg-hovered h-10 rounded-md text-sm font-medium border border-border hover:bg-secondary"
                  >
                    <BookOpenIcon className="h-5 w-5" />
                    Product Roadmap
                  </button>

                  <button
                    onClick={handleCloseAndReset}
                    className="w-full bg-primary text-primary-foreground h-10 rounded-md text-sm font-medium mt-2 hover:bg-primary/90"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    Share Feedback
                  </h2>
                  <button
                    onClick={handleCloseAndReset}
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

                <div className="mb-4">
                  <label htmlFor="feedback-message" className="sr-only">
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

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={
                        isLoading || screenshots.length >= MAX_SCREENSHOTS
                      }
                      className="flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      <CameraIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-blue-500">Add a screenshot</span>
                      <span>
                        ({screenshots.length}/{MAX_SCREENSHOTS} max.)
                      </span>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {screenshots.map((file, index) => (
                      <div
                        key={index}
                        className="relative w-full aspect-video rounded-md overflow-hidden"
                      >
                        <img
                          src={screenshotUrlsRef.current[index]}
                          alt={`Screenshot preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeScreenshot(index)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                          aria-label={`Remove screenshot ${index + 1}`}
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
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
                      "Submit"
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
