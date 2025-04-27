import React, { useState, useEffect, useCallback } from 'react';
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
import { ClipboardCopy, Mail, X } from 'lucide-react';
import { useSenders } from '@/context/sendersContext';
import { SenderIcon } from './SenderIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType =
  | 'account'
  | 'mailbox'
  | 'preferences'
  | 'notification'
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
  const [fontSize, setFontSize] = useState('small');

  const [showAddMailbox, setShowAddMailbox] = useState(false);
  const [showDisconnectOutlook, setShowDisconnectOutlook] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const { senders, isSendersLoading } = useSenders();
  const [allNotificationsEnabled, setAllNotificationsEnabled] = useState(true);
  const [feedSettings, setFeedSettings] = useState<Record<string, boolean>>({});
  const [previousSettings, setPreviousSettings] = useState<Record<string, boolean>>({});

  const [voiceList, setVoiceList] = useState<SpeechSynthesisVoice[]>([]);
  const [isVoicesLoaded, setIsVoicesLoaded] = useState(false);

  // Function to load available voices
  const loadVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      setVoiceList(availableVoices);
      setIsVoicesLoaded(true);
    }
  }, []);

  // Initialize voices when component mounts
  useEffect(() => {
    // Some browsers need a small delay to properly initialize speech synthesis
    const timer = setTimeout(() => {
      loadVoices();
    }, 100);

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      clearTimeout(timer);
      // Cancel any ongoing speech when component unmounts
      window.speechSynthesis.cancel();
    };
  }, [loadVoices]);

  // Function to play demo voice
  const playVoiceDemo = useCallback(() => {
    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      "This is a preview of your selected voice and speed settings."
    );

    // Set speech rate
    utterance.rate = voiceSpeed;

    // Find appropriate voice based on selection
    if (voiceList.length > 0) {
      let selectedVoiceObj;

      switch (selectedVoice) {
        case "Female":
          selectedVoiceObj = voiceList.find(
            voice => voice.name.toLowerCase().includes("female") ||
              (!voice.name.toLowerCase().includes("male") && voice.name.includes("Google") && !voice.name.includes("UK"))
          );
          break;
        case "Male":
          selectedVoiceObj = voiceList.find(
            voice => voice.name.toLowerCase().includes("male") && !voice.name.toLowerCase().includes("female")
          );
          break;
        case "British":
          selectedVoiceObj = voiceList.find(
            voice => voice.name.includes("UK") || voice.name.includes("British")
          );
          break;
        case "Australian":
          selectedVoiceObj = voiceList.find(
            voice => voice.name.includes("Australian") || voice.name.includes("AU")
          );
          break;
        default:
          // Default voice - typically first in the list or a neutral voice
          selectedVoiceObj = voiceList.find(
            voice => voice.lang.startsWith("en-")
          ) || voiceList[0];
      }

      if (selectedVoiceObj) {
        utterance.voice = selectedVoiceObj;
      }
    }

    // Play the speech
    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, voiceSpeed, voiceList]);

  useEffect(() => {
    if (senders && senders.length > 0) {
      const initialSettings: Record<string, boolean> = {};
      senders.forEach(sender => {
        initialSettings[sender.id] = true;
      });
      setFeedSettings(initialSettings);
      setPreviousSettings(initialSettings);
    }
  }, [senders]);

  // Handle toggling all feeds
  const handleToggleAllFeeds = () => {
    const newAllEnabled = !allNotificationsEnabled;
    setAllNotificationsEnabled(newAllEnabled);

    // Set all feed settings to match the master toggle
    const updatedSettings: Record<string, boolean> = {};
    Object.keys(feedSettings).forEach(key => {
      updatedSettings[key] = newAllEnabled;
    });
    setFeedSettings(updatedSettings);

    // If turning off, save current state for possible restore
    if (!newAllEnabled) {
      setPreviousSettings({ ...feedSettings });
    }
  };

  // Handle toggling individual feed
  const handleToggleFeed = (senderId: string) => {
    const updatedSettings = {
      ...feedSettings,
      [senderId]: !feedSettings[senderId]
    };

    setFeedSettings(updatedSettings);

    // Check if all feeds are now disabled
    const areAllDisabled = Object.values(updatedSettings).every(value => !value);

    // Update master toggle if all feeds are disabled
    if (areAllDisabled && allNotificationsEnabled) {
      setAllNotificationsEnabled(false);
    }
    // Update master toggle if at least one feed is enabled and master was off
    else if (!areAllDisabled && !allNotificationsEnabled) {
      setAllNotificationsEnabled(true);
    }
  }
  // Sort senders alphabetically
  const sortedSenders = senders ? [...senders].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  ) : [];

  // if (isSendersLoading) {
  //   return <div className="p-4">Loading notification settings...</div>;
  // }

  const handleAddMailbox = () => {
    setShowAddMailbox(true);
    setError('');
  };

  const handleCreateMailbox = () => {
    if (!username || !fullName) {
      setError('Please fill in all required fields.');
    }

    if (error) return;

    setShowAddMailbox(false);
    setError('');


  };

  const handleCloseModal = () => {
    setShowAddMailbox(false);
    setShowDisconnectOutlook(false);
    setError('');
  };

  const handleDisconnectOutlook = () => {
    setShowDisconnectOutlook(true);
  };

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
                  <UserCircleIcon className="h-14 w-14 " />
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
                className="w-full p-sm border border-border rounded-md bg-sidebar focus:outline-none text-sm cursor-not-allowed"
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
          <p className="text-sm text-muted-foreground">Manage your email addresses</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Rainbox Email Address</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use this email address when subscribing to newsletters. All newsletters sent to this address will appear here in Meco.
            </p>

            <div className="border border-border rounded-md flex justify-between items-center">
              <div className="flex items-center gap-3 p-sm flex-grow">
                <Image src="/RainboxLogo.png" alt="Rainbox Logo" width={24} height={24} className="w-8 h-8" />
                <div>
                  <div className="text-sm font-medium">Rainbox - Primary Email</div>
                  <div className="text-sm text-muted-foreground">ganesh123@rainbox.ai</div>
                </div>
              </div>
              <div className="p-3 border-l border-border">
                <ClipboardCopy className="h-5 w-5 cursor-pointer hover:text-primary" />
              </div>
            </div>

            <button
              onClick={handleAddMailbox}
              className="mt-4 flex items-center gap-2 px-4 py-2 border border-border rounded-md bg-sidebar hover:bg-hovered transition-colors text-sm"
            >
              + Add a secondary mailbox
            </button>
          </div>

          <hr className="border-border" />

          <div>
            <h3 className="font-medium mb-2">Connect your Gmail or Outlook</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bring your existing newsletters from Gmail or Outlook to Rainbox. Just sign in and select the sender — that's it! All existing and future emails from the senders will automatically appear in Rainbox.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <div className="border border-border rounded-md flex justify-between items-center w-full">
                  <div className="flex items-center gap-3 p-sm flex-grow">
                    <div className="bg-content rounded p-1 border border-border">
                      <svg className="h-6 w-6" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <span className="text-sm">Connect your Gmail</span>
                    </div>
                  </div>
                  <div className="border-l border-border p-3 bg-sidebar hover:bg-hovered cursor-pointer transition-colors">
                    <span className="text-sm">+ Connect</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="border border-border rounded-md flex justify-between items-center w-full">
                  <div className="flex items-center gap-3 p-sm flex-grow">
                    <div className="bg-content rounded p-1 border border-border">
                      <svg className="h-6 w-6" viewBox="0 0 24 24">
                        <rect width="24" height="24" fill="#0078D4" />
                        <path d="M12 15.5L5 11V22H19V11L12 15.5Z" fill="white" />
                        <path d="M19 2H5V11L12 15.5L19 11V2Z" fill="white" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Ganesh's Outlook</div>
                      <div className="text-sm text-muted-foreground">ganesh123@outlook.com</div>
                    </div>
                  </div>
                  <div className="border-l border-border p-3 hover:bg-hovered cursor-pointer transition-colors" onClick={handleDisconnectOutlook}>
                    <X className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div>
            <h3 className="font-medium mb-2">Automatically forward existing newsletters to Rainbox</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You can also get your newsletters from Gmail, Outlook or other email clients to Rainbox by setting up forwarding rules. This option is suitable if you don't want to connect your Gmail or Outlook. Check the guide below to learn email forwarding.
            </p>

            <div className="space-y-2">
              <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Forwarding from Gmail</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                <Mail className="h-4 w-4" />
                <span className="text-sm">Forwarding from Outlook</span>
              </a>
            </div>
          </div>
        </div>



        {/* Add a New Mailbox Modal */}
        {showAddMailbox && (
          <div className="fixed mt-0 inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ marginTop: '0px' }}>
            <div className="bg-content rounded-lg w-full max-w-md p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Add a New Mailbox</h2>
                <button onClick={handleCloseModal} className="">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-6 text-sm">Create a new Rainbox address for your Newsletters</p>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-md"
                />

                <div className="flex">
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 border rounded-l-md"
                  />
                  <div className="bg-sidebar px-3 py-3 border-t border-r border-b rounded-r-md text-sm">
                    @rainbox.app
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <button
                  onClick={handleCreateMailbox}
                  className="w-full bg-sidebar text-md rounded-md py-2 mt-4"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Disconnect Outlook Modal */}
        {showDisconnectOutlook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ marginTop: '0px' }}>
            <div className="bg-content rounded-lg w-full max-w-md p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Disconnect Outlook</h2>
                <button onClick={handleCloseModal} className="">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mb-6 text-sm">Are you sure you want to disconnect Outlook? You'll not receive any future emails from Outlook.</p>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-500 text-md rounded-md py-2"
                >
                  &lt; Go back
                </button>
                <button
                  onClick={() => {
                    // Implementation for disconnecting would go here
                    handleCloseModal();
                  }}
                  className="flex-1 bg-sidebar text-md rounded-md py-2"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    ),
    preferences: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Preferences</h2>
          <p className="text-sm text-muted-foreground">Customize your experience</p>
        </div>

        <div className="space-y-8">
          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Display Settings</h3>

            <div className="flex items-center justify-between">
              <label htmlFor="font-size" className="text-sm font-medium">Font Size</label>
              <select
                id="font-size"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-40 p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>

          <hr className="border-border" />

          {/* AI Summary */}
          <div className="space-y-4">
            <h3 className="font-medium">AI Summary</h3>
            <div>
              <label htmlFor="ai-prompt" className="block text-sm font-medium mb-1">Default prompt for summaries</label>
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => {
                  if (e.target.value.length <= 250) {
                    setAiPrompt(e.target.value);
                  }
                }}
                maxLength={250}
                rows={3}
                className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  This prompt will be used when generating AI summaries of your content.
                </p>
                <p className="text-xs text-muted-foreground">
                  {250 - (aiPrompt?.length || 0)} characters remaining
                </p>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Text to Speech */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <SpeakerWaveIcon className="h-5 w-5" />
              Text to Speech
            </h3>

            <div className="flex items-center justify-between">
              <label htmlFor="voice" className="text-sm font-medium">Voice</label>
              <select
                id="voice"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-40 p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
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
                <span>0.5x</span>
                <span>1x</span>
                <span>1.5x</span>
                <span>2x</span>
              </div>
            </div>

            <div className="mt-4 p-4 border border-border rounded-md bg-sidebar">
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-center">Preview your selected voice and speed</p>
                <button
                  onClick={playVoiceDemo}
                  disabled={!isVoicesLoaded}
                  className="flex items-center gap-2 px-4 py-2 bg-hovered hover:bg-card text-sm rounded-md transition-colors"
                >
                  <SpeakerWaveIcon className="h-4 w-4" />
                  Play Demo
                </button>
              </div>
              <div className="mt-3 text-xs text-center text-muted-foreground">
                Sample text: "This is a preview of your selected voice and speed settings."
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    notification: (<div className="bg-content rounded-lg max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Notification</h2>
        <p className="text-sm text-muted-foreground">Manage the notifications on your desktop and mobile</p>
      </div>

      <div className="space-y-4">
        {/* All feeds toggle */}
        <div className="flex items-center justify-between py-3 pr-2">
          <span className="font-medium">All feeds</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={allNotificationsEnabled}
              onChange={handleToggleAllFeeds}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-hovered rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>

          </label>
        </div>

        <hr className="border-gray-200" />

        {/* Individual feed toggles */}
        <div className="max-h-60 overflow-y-auto pr-2">
          {sortedSenders.map((sender) => (
            <div key={sender.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <SenderIcon sender={sender} />
                <span className="text-sm">{sender.name}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={feedSettings[sender.id] || false}
                  onChange={() => handleToggleFeed(sender.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-hovered rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>

              </label>
            </div>
          ))}
        </div>
      </div>
    </div>),
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
            <div className="w-56 border-r border-border overflow-y-auto custom-scrollbar bg-sidebar">
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
                        onClick={() => setActiveTab('notification')}
                        className={`flex items-center gap-2 w-full p-sm rounded-md transition-colors ${activeTab === 'notification' ? 'bg-hovered text-accent-foreground' : 'hover:bg-hovered'}`}
                      >
                        <BellIcon className="h-5 w-5" />
                        <span className='text-sm'>Notification</span>
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
                        <span className='text-sm'>Report Issues  🡥</span>

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

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md mx-4 border border-border p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Delete Account</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xl font-bold"
              >
                X
              </button>
            </div>

            <p className="text-sm mb-6">
              All your data will be deleted permanently. Are you sure you want to delete your account?
            </p>

            <div className="mb-6">
              <label className="block text-sm mb-2">Feedback (Optional)</label>
              <textarea
                placeholder="Got a sec? Tell us why you're leaving and how we can improve."
                className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none text-sm"
                rows={4}
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
              >
                Delete Account
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-3 bg-black text-sm font-medium rounded-full transition-colors"
              >
                Go back
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SettingsModal;