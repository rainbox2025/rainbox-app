import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from "@/context/authContext";
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
  ArrowPathIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType =
  | 'account'
  | 'mailbox'
  | 'preferences'
  | 'billing'
  | 'reportIssues'
  | 'suggestFeature'
  | 'helpDoc'
  | 'contactSupport'
  | 'roadmap'
  | 'changelog'
  | 'plans'
  | 'visitWebsite'
  | 'followX';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Summarize this in a concise manner');
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState('Default');
  const [globalNotifications, setGlobalNotifications] = useState(true);

  // Define redirect destinations
  const redirectDestinations = {
    reportIssues: 'https://feedback.example.com/issues',
    suggestFeature: 'https://feedback.example.com/suggestions',
    helpDoc: 'https://help.example.com',
    contactSupport: 'https://support.example.com',
    roadmap: 'https://roadmap.example.com',
    changelog: 'https://changelog.example.com',
    plans: 'https://plans.example.com',
    visitWebsite: 'https://www.example.com',
    followX: 'https://twitter.com/example'
  };

  // Sample notification feeds
  const [notificationFeeds, setNotificationFeeds] = useState([
    { id: 1, name: 'Comments', enabled: true },
    { id: 2, name: 'Mentions', enabled: true },
    { id: 3, name: 'Updates', enabled: false },
    { id: 4, name: 'New features', enabled: true },
  ]);

  const updateNotificationFeed = (id: number, enabled: boolean) => {
    setNotificationFeeds(
      notificationFeeds.map(feed =>
        feed.id === id ? { ...feed, enabled } : feed
      )
    );
  };

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const redirectToExternalLink = (url: string) => {
    window.open(url, '_blank');
    onClose();
  };

  const handleDeleteAccount = () => {
    console.log("Delete account button clicked");
    setIsDeleteModalOpen(false);
    // Here you would typically call an API to delete the account
  };

  if (!isOpen) return null;

  const tabContent = {
    account: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Account</h2>
          <p className="text-muted-foreground text-sm">Manage your account settings</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-hovered flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt="User Avatar"
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-14 w-14 text-gray-500" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-primary rounded-full p-1 text-primary-foreground">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div>
              <h3 className="font-medium">Profile Image</h3>
              <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                id="name"
                defaultValue={user?.user_name || "username"}
                className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email address</label>
              <input
                type="email"
                id="email"
                defaultValue={user?.email || ""}
                disabled
                className="w-full p-sm border border-border rounded-md bg-gray-100 dark:bg-gray-700 focus:outline-none text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 text-sm text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
            >
              Delete account
            </button>
            <p className="text-xs text-muted-foreground mt-1">
              This will permanently delete your account and all associated data.
            </p>
          </div>
        </div>
      </div>
    ),
    mailbox: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Mailbox</h2>
          <p className="text-muted-foreground text-sm">Manage your email preferences</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Email notifications</h3>
              <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-gray-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-900 dark:peer-checked:bg-gray-700"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Weekly digest</h3>
              <p className="text-sm text-muted-foreground">Receive a weekly summary of your activity</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={false}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-gray-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-900 dark:peer-checked:bg-gray-700"></div>
            </label>
          </div>
        </div>
      </div>
    ),
    preferences: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Preferences</h2>
          <p className="text-muted-foreground text-sm">Customize your experience</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-medium">AI Summary</h3>
            <div>
              <label htmlFor="ai-prompt" className="block text-sm font-medium mb-1">Default prompt for summaries</label>
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This prompt will be used when generating AI summaries of your content
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <SpeakerWaveIcon className="h-5 w-5" />
              Text to Speech
            </h3>

            <div>
              <label htmlFor="voice" className="block text-sm font-medium mb-1">Voice</label>
              <select
                id="voice"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                <option value="Default">Default</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="British">British</option>
                <option value="Australian">Australian</option>
              </select>
            </div>

            <div>
              <label htmlFor="speed" className="block text-sm font-medium mb-1">
                Default speed: {voiceSpeed}x
              </label>
              <input
                type="range"
                id="speed"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className='text-sm'>0.5x</span>
                <span className='text-sm'>1x</span>
                <span className='text-sm'>1.5x</span>
                <span className='text-sm'>2x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    billing: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Billing</h2>
          <p className="text-muted-foreground text-sm">Manage your subscription and payment methods</p>
        </div>

        <div className="space-y-6">
          <div className="p-4 border border-border rounded-md">
            <h3 className="font-medium mb-2">Current Plan</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-medium">Free</p>
                <p className="text-sm text-muted-foreground">Basic features included</p>
              </div>
              <button className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors">
                Upgrade
              </button>
            </div>
          </div>

          <div className="p-4 border border-border rounded-md">
            <h3 className="font-medium mb-2">Payment Methods</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You don't have any payment methods added yet.
            </p>
            <button className="px-4 py-2 text-sm border border-border rounded-md hover:bg-hovered transition-colors">
              Add payment method
            </button>
          </div>
        </div>
      </div>
    ),
    // All other tabs will redirect to external links
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm w-[100vw]">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card text-card-foreground dark:bg-card dark:text-card-foreground rounded-lg shadow-xl w-full max-w-3xl h-[93vh] mx-4 mb-2 border border-border flex flex-col"
        >
          <div className="flex flex-1 overflow-hidden rounded-lg">
            {/* Left sidebar with tabs */}
            <div className="w-56 border-r border-border overflow-y-auto bg-sidebar">
              <div className="p-sm">
                {/* Main sections */}
                <div className="mb-2">
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => setActiveTab('account')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'account' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        <span className='text-sm'>Account</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab('mailbox')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'mailbox' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <EnvelopeIcon className="h-5 w-5" />
                        <span className='text-sm'>Mailbox</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab('preferences')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'preferences' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                        <span className='text-sm'>Preferences</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab('billing')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'billing' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <BillingIcon className="h-5 w-5" />
                        <span className='text-sm'>Billing</span>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Divider */}
                <div className="h-px bg-border my-2"></div>

                {/* Help & Support */}
                <div className="mb-2">
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => redirectToExternalLink(redirectDestinations.reportIssues)}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors hover:bg-hovered`}
                      >
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <span className='text-sm'>Report Issues</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => redirectToExternalLink(redirectDestinations.suggestFeature)}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors hover:bg-hovered`}
                      >
                        <LightBulbIcon className="h-5 w-5" />
                        <span className='text-sm'>Suggest Feature</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => redirectToExternalLink(redirectDestinations.helpDoc)}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors hover:bg-hovered`}
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                        <span className='text-sm'>Help Docs</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => redirectToExternalLink(redirectDestinations.contactSupport)}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors hover:bg-hovered`}
                      >
                        <QuestionMarkCircleIcon className="h-5 w-5" />
                        <span className='text-sm'>Contact Support</span>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Divider */}
                <div className="h-px bg-border my-2"></div>

                {/* Product Info */}
                <div className="mb-2">
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => redirectToExternalLink(redirectDestinations.roadmap)}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors hover:bg-hovered`}
                      >
                        <MapIcon className="h-5 w-5" />
                        <span className='text-sm'>Roadmap</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => redirectToExternalLink(redirectDestinations.changelog)}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors hover:bg-hovered`}
                      >
                        <ClockIcon className="h-5 w-5" />
                        <span className='text-sm'>Changelog</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => redirectToExternalLink(redirectDestinations.plans)}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors hover:bg-hovered`}
                      >
                        <CreditCardIcon className="h-5 w-5" />
                        <span className='text-sm'>Plans</span>
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Divider */}
                <div className="h-px bg-border my-2"></div>

                {/* External Links */}
                <div>
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => redirectToExternalLink(redirectDestinations.visitWebsite)}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors hover:bg-hovered`}
                      >
                        <GlobeAltIcon className="h-5 w-5" />
                        <span className='text-sm'>Visit Website</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => redirectToExternalLink(redirectDestinations.followX)}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors hover:bg-hovered`}
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className='text-sm'>Follow us on X</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right content area */}
            <div className="relative flex-1 overflow-y-auto p-md bg-content">
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

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md mx-4 border border-border p-6"
          >
            <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete your account? This action cannot be undone and will result in the permanent loss of all your data, including saved settings, history, and personal information.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-hovered rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-md transition-colors"
              >
                Yes, Delete My Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;