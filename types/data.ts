export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  user_name?: string;
  plan: 'free' | 'pro' | 'enterprise';
  usedFeeds: number;
  totalFeeds: number;
}
export interface SenderType {
  id: string;
  name: string;
  email: string;
  domain?: string;
  user_id: string;
  created_at: string;
  folder_id?: string;
  icon?: string;
  count: number;
  folder?: string;
  order?: number;
}
export interface FolderType {
  id: string;
  name: string;
  user_id?: string;
  created_at?: string;
  count: number;
  isExpanded?: boolean;
  senders?: SenderType[];
  order?: number;
}
export interface Mail {
  id: string;
  user_id: string;
  sender_id: string;
  created_at: string;
  subject: string;
  body: string;
  read: boolean;
  bookmarked: boolean;
}
export interface Feed {
  id: string;
  name: string;
  icon?: string;
  count: number;
  category?: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
  isExpanded: boolean;
}

export interface User {
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  usedFeeds: number;
  totalFeeds: number;
}