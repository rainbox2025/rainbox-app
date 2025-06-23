import { useSenders } from '@/context/sendersContext';
import React, { useEffect, useState } from 'react'
import { SenderIcon } from '../../sidebar/sender-icon';


export default function NotificationTab() {

  const [allNotificationsEnabled, setAllNotificationsEnabled] = useState(true);
  const [feedSettings, setFeedSettings] = useState<Record<string, boolean>>({});
  const [previousSettings, setPreviousSettings] = useState<Record<string, boolean>>({});
  const { senders, isSendersLoading } = useSenders();

  // Handle toggling all feeds
  const handleToggleAllFeeds = () => {
    const newAllEnabled = !allNotificationsEnabled;
    setAllNotificationsEnabled(newAllEnabled);

    // Set all feed settings to match the master toggle


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

  return (
    <div className="bg-content rounded-lg max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Notification</h2>
        <p className="text-sm text-muted-foreground">Manage the notifications on your desktop and mobile</p>
      </div>

      <div className="space-y-4">
        {/* All feeds toggle */}
        <div className="flex items-center justify-between py-3 pr-2">
          <span className="text-sm md:text-md font-medium">Enable notifications for all feeds</span>
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

        <hr className="border-border" style={{ margin: "1rem 0" }} />

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
    </div>
  )
}
