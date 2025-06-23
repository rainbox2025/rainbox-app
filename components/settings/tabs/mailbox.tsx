import React, { useState } from 'react';
import Image from 'next/image';
import ConnectionCard from '../ConnectionCard';
import { GmailConnectionFlow } from '@/components/connect-gmail/flow';
import AddMailBox from '../add-mail-box';
import DisconnectBox from '../disconnect-box';

export default function MailboxTab() {
  const [showAddMailbox, setShowAddMailbox] = useState(false);
  const [showDisconnectOutlook, setShowDisconnectOutlook] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isGmailFlowOpen, setIsGmailFlowOpen] = useState(false);
  const [error, setError] = useState('');

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

  const handleAddMailbox = () => {
    setShowAddMailbox(true);
    setError('');
  };

  const handleDisconnectOutlook = () => {
    setShowDisconnectOutlook(true);
  };



  return (
    <>
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

            <ConnectionCard
              logo="/RainboxLogo.png"
              logoAlt="Rainbox Logo"
              title="Rainbox - Primary Email"
              subtitle="ganesh123@rainbox.ai"
              actionType="copy"
              onAction={() => { }}
              isConnected={true}
            />

            <button
              onClick={handleAddMailbox}
              className="mt-4 flex items-center gap-2 px-4 py-2 border border-border rounded-md bg-hovered hover:bg-hovered transition-colors text-sm"
            >
              + Add a secondary mailbox
            </button>
          </div>

          <hr className="border-border" style={{ margin: "1rem 0" }} />

          <div style={{ marginTop: "0" }}>
            <h3 className="font-medium mb-2">Connect your Gmail or Outlook</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bring your existing newsletters from Gmail or Outlook to Rainbox. Just sign in and select the sender — that's it! All existing and future emails from the senders will automatically appear in Rainbox.
            </p>

            <div className="space-y-4">
              <div className="flex items-center">
                <ConnectionCard
                  logo="svg"
                  logoAlt="Google Logo"
                  title="Connect your Gmail"
                  subtitle=""
                  actionType="connect"
                  onAction={() => { setIsGmailFlowOpen(true) }}
                  isConnected={false}
                />
              </div>

              <div className="flex items-center">
                <ConnectionCard
                  logo="/OutlookLogo.png"
                  logoAlt="Outlook Logo"
                  title="Ganesh's Outlook"
                  subtitle="ganesh123@outlook.com"
                  actionType="resync"
                  onAction={handleDisconnectOutlook}
                  isConnected={true}
                />

              </div>
            </div>
          </div>

          <hr className="border-border" style={{ margin: "1rem 0" }} />

          <div style={{ marginTop: "0" }}>
            <h3 className="font-medium mb-2" >Automatically forward existing newsletters to Rainbox</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You can also get your newsletters frraom Gmail, Outlook or other email clients to Rainbox by setting up forwarding rules. This option is suitable if you don't want to connect your Gmail or Outlook. Check the guide below to learn email forwarding.
            </p>

            <div className="space-y-2">
              <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                <Image src="/YoutubeLogo.png" alt="Rainbox Logo" width={24} height={24} className="w-5 h-5" />
                <span className="text-sm">Forwarding from Gmail</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-primary hover:underline">
                <Image src="/YoutubeLogo.png" alt="Rainbox Logo" width={24} height={24} className="w-5 h-5" />
                <span className="text-sm">Forwarding from Outlook</span>
              </a>
            </div>
          </div>
        </div>



        {/* Add a New Mailbox Modal */}
        <AddMailBox showAddMailbox={showAddMailbox} handleCloseModal={handleCloseModal} fullName={fullName} setFullName={setFullName} username={username} setUsername={setUsername} handleCreateMailbox={handleAddMailbox} />

        {/* Disconnect Outlook Modal */}
        <DisconnectBox showDisconnectOutlook={showDisconnectOutlook} handleCloseModal={handleCloseModal} />
      </div>
      <GmailConnectionFlow
        isOpen={isGmailFlowOpen}
        onClose={() => setIsGmailFlowOpen(false)}
        onConnectionComplete={() => setIsGmailFlowOpen(false)}
      />
    </>
  )
}
