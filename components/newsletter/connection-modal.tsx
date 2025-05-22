import React from 'react';
import { Connection } from '@/types/data';

interface ConnectionCardProps {
  connection: Connection;
  onConnect: (type: 'gmail' | 'outlook') => void;
  onSelectSender: (email: string, accountName: string) => void;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ connection, onConnect, onSelectSender }) => {
  const handleAction = () => {
    if (connection.isConnected && connection.userEmail) {
      onSelectSender(connection.userEmail, connection.accountName);
    } else {
      onConnect(connection.type);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg mb-3">
      <div className="flex items-center">
        {connection.logo}
        <div>
          <p className="text-sm font-medium text-neutral-800">{connection.accountName}</p>
          {connection.isConnected && connection.userEmail && (
            <p className="text-xs text-neutral-500">{connection.userEmail}</p>
          )}
        </div>
      </div>
      <button
        onClick={handleAction}
        className="bg-neutral-800 text-white text-xs font-medium py-2 px-4 rounded-md hover:bg-neutral-700 transition-colors"
      >
        {connection.isConnected ? 'Select Sender' : `Connect ${connection.type === 'gmail' ? 'Gmail' : 'Outlook'}`}
      </button>
    </div>
  );
};