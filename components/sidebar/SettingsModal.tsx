import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowPathIcon,
  SpeakerWaveIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType =
  | 'account'
  | 'preferences'
  | 'notifications'
  | 'reportIssues'
  | 'suggestFeature'
  | 'contactSupport'
  | 'roadmap'
  | 'changelog'
  | 'plans'
  | 'visitWebsite';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Summarize this in a concise manner');
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState('Default');
  const [globalNotifications, setGlobalNotifications] = useState(true);

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
              <div className="h-16 w-16 rounded-full bg-hovered flex items-center justify-center">
                <UserCircleIcon className="h-14 w-14 text-gray-500" />
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
                defaultValue="Collaborator"
                className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email address</label>
              <input
                type="email"
                id="email"
                defaultValue="xyz@example.com"
                disabled
                className="w-full p-sm border border-border rounded-md bg-gray-100 dark:bg-gray-700 focus:outline-none text-sm cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">Contact support to change your email</p>
            </div>

            {isChangingPassword ? (
              <div className="space-y-4 p-sm border border-border rounded-md bg-content">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium mb-1">Current password</label>
                  <input
                    type="password"
                    id="current-password"
                    className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium mb-1">New password</label>
                  <input
                    type="password"
                    id="new-password"
                    className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">Confirm new password</label>
                  <input
                    type="password"
                    id="confirm-password"
                    className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsChangingPassword(false)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:bg-hovered rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors"
                  >
                    Update password
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-hovered transition-colors"
              >
                Change password
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <button className="px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors">
              Delete account
            </button>
            <p className="text-xs text-muted-foreground mt-1">
              This will permanently delete your account and all associated data.
            </p>
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
    notifications: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Notifications</h2>
          <p className="text-muted-foreground text-sm">Manage how you receive notifications</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Global notifications</h3>
              <p className="text-sm text-muted-foreground">Enable or disable all notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={globalNotifications}
                onChange={() => setGlobalNotifications(!globalNotifications)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-hovered peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Notification feeds</h3>
            <p className="text-sm text-muted-foreground">Choose which notifications you want to receive</p>

            <div className="space-y-3 mt-2">
              {notificationFeeds.map(feed => (
                <div key={feed.id} className="flex items-center justify-between">
                  <span className="text-sm">{feed.name}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feed.enabled && globalNotifications}
                      onChange={(e) => updateNotificationFeed(feed.id, e.target.checked)}
                      disabled={!globalNotifications}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-hovered peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary ${!globalNotifications ? 'opacity-50' : ''}`}></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    reportIssues: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Report Issues</h2>
          <p className="text-muted-foreground text-sm">Help us improve by reporting any issues you encounter</p>
        </div>

        <div className="bg-hovered rounded-lg p-md space-y-4">
          <p>We use Canny to track and manage issues. You'll be redirected to our feedback portal.</p>
          <button
            onClick={() => redirectToExternalLink('https://feedback.example.com/issues')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors"
          >
            Report an issue
          </button>
        </div>
      </div>
    ),
    suggestFeature: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Suggest a Feature</h2>
          <p className="text-muted-foreground text-sm">Have an idea for a new feature? Let us know!</p>
        </div>

        <div className="bg-hovered rounded-lg p-md space-y-4">
          <p>We love hearing your ideas. You'll be redirected to our feature request portal.</p>
          <button
            onClick={() => redirectToExternalLink('https://feedback.example.com/suggestions')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors"
          >
            Suggest a feature
          </button>
        </div>
      </div>
    ),
    contactSupport: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Contact Support</h2>
          <p className="text-muted-foreground text-sm">Get help from our support team</p>
        </div>

        <div className="bg-hovered rounded-lg p-md space-y-4">
          <p>Need help? Our support team is ready to assist you.</p>
          <button
            onClick={() => redirectToExternalLink('https://support.example.com')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors"
          >
            Contact support
          </button>
        </div>
      </div>
    ),
    roadmap: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Roadmap</h2>
          <p className="text-muted-foreground text-sm">See what's coming next</p>
        </div>

        <div className="bg-hovered rounded-lg p-md space-y-4">
          <p>Check out our public roadmap to see what features we're working on.</p>
          <button
            onClick={() => redirectToExternalLink('https://roadmap.example.com')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors"
          >
            View roadmap
          </button>
        </div>
      </div>
    ),
    changelog: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Changelog</h2>
          <p className="text-muted-foreground text-sm">See what's new and what's changed</p>
        </div>

        <div className="bg-hovered rounded-lg p-md space-y-4">
          <p>Keep up with the latest updates and improvements to our platform.</p>
          <button
            onClick={() => redirectToExternalLink('https://changelog.example.com')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors"
          >
            View changelog
          </button>
        </div>
      </div>
    ),
    plans: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Plans</h2>
          <p className="text-muted-foreground text-sm">Manage your subscription</p>
        </div>

        <div className="bg-hovered rounded-lg p-md space-y-4">
          <p>View and manage your current plan or upgrade to access more features.</p>
          <button
            onClick={() => redirectToExternalLink('https://plans.example.com')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors"
          >
            View plans
          </button>
        </div>
      </div>
    ),
    visitWebsite: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Visit Website</h2>
          <p className="text-muted-foreground text-sm">Explore our website</p>
        </div>

        <div className="bg-hovered rounded-lg p-md space-y-4">
          <p>Learn more about our products and services on our website.</p>
          <button
            onClick={() => redirectToExternalLink('https://www.example.com')}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors"
          >
            Visit website
          </button>
        </div>
      </div>
    ),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card text-card-foreground dark:bg-card dark:text-card-foreground rounded-lg shadow-xl w-full max-w-3xl h-[95vh] mx-4 border border-border flex flex-col"
        >
          <div className="flex flex-1 overflow-hidden rounded-lg">
            {/* Left sidebar with tabs */}
            <div className="w-56 border-r border-border overflow-y-auto bg-sidebar">
              <div className="p-sm">
                <div className="">
                  {/* <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Account</h3> */}
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
                  </ul>
                </div>

                <div className="">
                  {/* <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Personal</h3> */}
                  <ul className="space-y-1">
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
                        onClick={() => setActiveTab('notifications')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'notifications' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <BellIcon className="h-5 w-5" />
                        <span className='text-sm'>Notifications</span>
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="">
                  {/* <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Support</h3> */}
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => setActiveTab('reportIssues')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'reportIssues' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <span className='text-sm'>Report Issues</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab('suggestFeature')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'suggestFeature' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <LightBulbIcon className="h-5 w-5" />
                        <span className='text-sm'>Suggest Feature</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab('contactSupport')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'contactSupport' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <QuestionMarkCircleIcon className="h-5 w-5" />
                        <span className='text-sm'>Contact Support</span>
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="">
                  {/* <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Resources</h3> */}
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => setActiveTab('roadmap')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'roadmap' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <MapIcon className="h-5 w-5" />
                        <span className='text-sm'>Roadmap</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab('changelog')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'changelog' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <ClockIcon className="h-5 w-5" />
                        <span className='text-sm'>Changelog</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab('plans')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'plans' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <CreditCardIcon className="h-5 w-5" />
                        <span className='text-sm'>Plans</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => setActiveTab('visitWebsite')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'visitWebsite' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <GlobeAltIcon className="h-5 w-5" />
                        <span className='text-sm'>Visit Website</span>
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
              {tabContent[activeTab]}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SettingsModal;