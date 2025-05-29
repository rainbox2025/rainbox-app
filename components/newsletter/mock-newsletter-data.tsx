import { Connection, Sender } from '@/types/data';

export const MOCK_RAINBOX_EMAIL = 'ganesh123@rainbox.ai';

export const MOCK_CONNECTIONS: Connection[] = [
  {
    id: 'outlook-conn-1',
    type: 'outlook',
    accountName: "Ganesh's Outlook",
    userEmail: 'ganesh123@outlook.com',
    isConnected: true,
    logo: '/OutlookLogo.png',
    logoAlt: 'Outlook Logo',
  },
  {
    id: 'gmail-conn-1',
    type: 'gmail',
    accountName: 'Connect your Gmail',
    userEmail: null,
    isConnected: false,
    logo: '/OutlookLogo.png',
    logoAlt: 'Gmail Logo',
  },
];


export const MOCK_SUGGESTED_SENDERS: Sender[] = [
  { id: 'sender-1', name: 'Creator Spotlight', email: 'creator-spotlight@mail.beehiiv.com' },
  { id: 'sender-2', name: 'Tech Digest', email: 'digest@tech.com' },
  { id: 'sender-3', name: 'Daily Design', email: 'daily@design.io' },
  { id: 'sender-4', name: 'Marketing Weekly', email: 'newsletter@marketing.biz' },
  { id: 'sender-5', name: 'Product Hunt', email: 'hello@producthunt.com' },
];