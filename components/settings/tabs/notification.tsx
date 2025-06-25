import { useSettings } from '@/context/settingsContext';
import React from 'react';
import { SenderIcon } from '../../sidebar/sender-icon';

export default function NotificationTab() {
  const {
    senders,
    globalNotificationsEnabled,
    updateGlobalNotifications,
    updateSenderNotification
  } = useSettings();

  const sortedSenders = [...senders].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  return (
    <div className="bg-content rounded-lg max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">Notification</h2>
        <p className="text-sm text-muted-foreground">Manage the notifications on your desktop and mobile</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 pr-2">
          <span className="text-sm md:text-md font-medium">Enable notifications for all feeds</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={globalNotificationsEnabled}
              onChange={() => updateGlobalNotifications(!globalNotificationsEnabled)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-hovered rounded-full peer peer-checked:bg-toggle peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>



          </label>
        </div>

        <hr className="border-border" />

        <div className="pr-2">
          {sortedSenders.map((sender) => (
            <div key={sender.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <SenderIcon sender={sender} />
                <span className="text-sm">{sender.name}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sender.notification ?? true}
                  onChange={() => updateSenderNotification(sender.id, !(sender.notification ?? true))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-hovered rounded-full peer peer-checked:bg-toggle peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}