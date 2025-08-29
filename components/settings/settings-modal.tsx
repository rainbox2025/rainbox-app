import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  MapIcon,
  ClockIcon,
  CreditCardIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  CreditCardIcon as BillingIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import AccountTab from "./tabs/account";
import MailboxTab from "./tabs/mailbox";
import PreferencesTab from "./tabs/preferences";
import NotificationTab from "./tabs/notification";
import BillingTab from "./tabs/billing";
import { FeedbackModal } from "../feedback-modal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType =
  | "account"
  | "mailbox"
  | "preferences"
  | "notification"
  | "billing"
  | "reportIssues"
  | "suggestFeature"
  | "helpDoc"
  | "contactSupport"
  | "roadmap"
  | "changelog"
  | "plans"
  | "visitWebsite"
  | "followX";

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("account");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Define redirect destinations
  const redirectDestinations = {
    reportIssues: "https://feedback.example.com/issues",
    suggestFeature: "https://feedback.example.com/suggestions",
    helpDoc: "https://help.example.com",
    contactSupport: "team@rainbox.ai",
    roadmap: "https://rainbox.featurebase.app/roadmap",
    changelog: "https://rainbox.featurebase.app/changelog",
    plans: "https://rainbox.ai/plans",
    visitWebsite: "https://rainbox.ai",
    followX: "https://x.com/rainbox_ai",
  };

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll when modal is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const redirectToExternalLink = (url: string) => {
    window.open(url, "_blank");
    onClose();
  };

  if (!isOpen) return null;

  const tabContent = {
    account: <AccountTab />,
    mailbox: <MailboxTab />,
    preferences: <PreferencesTab />,
    notification: <NotificationTab />,
    billing: <BillingTab />,
    // All other tabs will redirect to external links
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm w-[100vw] z-[10000]"
      style={{ zIndex: 10000 }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card text-card-foreground rounded-lg shadow-xl w-[90vw] md:w-full max-w-2xl h-[93vh] mx-4 mb-2 border border-border flex flex-col relative z-[10000]"
          style={{ zIndex: "10000 !important" }}
        >
          <div className="flex flex-1 overflow-hidden rounded-lg">
            {/* Left sidebar with tabs */}
            <div className="w-12 md:w-56 border-r border-border overflow-y-auto custom-scrollbar bg-sidebar">
              <div className="md:p-sm">
                {/* Main sections */}
                <div className="mb-2">
                  <ul className="">
                    <li>
                      <button
                        onClick={() => setActiveTab("account")}
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors ${
                          activeTab === "account"
                            ? "bg-hovered text-accent-foreground"
                            : "hover:bg-hovered"
                        }`}
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">Account</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab("mailbox")}
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors ${
                          activeTab === "mailbox"
                            ? "bg-hovered text-accent-foreground"
                            : "hover:bg-hovered"
                        }`}
                      >
                        <EnvelopeIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">Mailbox</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab("preferences")}
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors ${
                          activeTab === "preferences"
                            ? "bg-hovered text-accent-foreground"
                            : "hover:bg-hovered"
                        }`}
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Preferences
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab("notification")}
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors ${
                          activeTab === "notification"
                            ? "bg-hovered text-accent-foreground"
                            : "hover:bg-hovered"
                        }`}
                      >
                        <BellIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Notification
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab("billing")}
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors ${
                          activeTab === "billing"
                            ? "bg-hovered text-accent-foreground"
                            : "hover:bg-hovered"
                        }`}
                      >
                        <BillingIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">Billing</span>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Divider */}
                <div className="h-px bg-border my-1"></div>

                {/* Help & Support */}
                <div className="mb-2">
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => setIsFeedbackOpen(true)}
                        className="flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered"
                      >
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Feedback 🡥
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() =>
                          redirectToExternalLink(redirectDestinations.roadmap)
                        }
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered`}
                      >
                        <MapIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Roadmap 🡥
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() =>
                          redirectToExternalLink(redirectDestinations.changelog)
                        }
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered`}
                      >
                        <ClockIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Changelog 🡥
                        </span>
                      </button>
                    </li>
                    {/* <li>
                      <button
                        onClick={() =>
                          redirectToExternalLink(
                            redirectDestinations.reportIssues
                          )
                        }
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered`}
                      >
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Report Issues 🡥
                        </span>
                      </button>
                    </li> */}
                    {/* <li>
                      <button
                        onClick={() =>
                          redirectToExternalLink(
                            redirectDestinations.suggestFeature
                          )
                        }
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered`}
                      >
                        <LightBulbIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Suggest Feature 🡥
                        </span>
                      </button>
                    </li> */}
                    {/* <li>
                      <button
                        onClick={() =>
                          redirectToExternalLink(redirectDestinations.helpDoc)
                        }
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered`}
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Help Docs 🡥
                        </span>
                      </button>
                    </li> */}
                    <li>
                      <button
                        onClick={() =>
                          window.open(
                            `mailto:${redirectDestinations.contactSupport}`,
                            "_blank"
                          )
                        }
                        className="flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered"
                      >
                        <QuestionMarkCircleIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Contact Us 🡥
                        </span>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Divider */}
                <div className="h-px bg-border my-1"></div>

                {/* Product Info */}
                <div className="mb-2">
                  <ul className="space-y-1">
                    {/* <li>
                      <button
                        onClick={() =>
                          redirectToExternalLink(redirectDestinations.plans)
                        }
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered`}
                      >
                        <CreditCardIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Plans 🡥
                        </span>
                      </button>
                    </li> */}
                    <li>
                      <button
                        onClick={() =>
                          redirectToExternalLink(
                            redirectDestinations.visitWebsite
                          )
                        }
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered`}
                      >
                        <GlobeAltIcon className="h-5 w-5" />
                        <span className="text-sm hidden md:inline">
                          Website 🡥
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() =>
                          redirectToExternalLink(redirectDestinations.followX)
                        }
                        className={`flex items-center gap-2 w-full p-sm justify-center md:justify-start rounded-md transition-colors hover:bg-hovered`}
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-sm hidden md:inline">
                          Follow up on X 🡥
                        </span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right content area */}
            <div className="relative flex-1 overflow-y-auto custom-scrollbar p-md bg-content">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              {tabContent[activeTab as keyof typeof tabContent] || null}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default SettingsModal;
