export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  user_name?: string;
  full_name?: string;
  plan?: "free" | "pro" | "enterprise";
  usedFeeds?: number;
  totalFeeds?: number;
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
  isRead?: boolean;
  image_url?: string;
  notification?: boolean ;
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
  isRead?: boolean;
  notification?: boolean;
}
export interface Mail {
  id: string;
  user_id: string;
  sender_id: string;
  created_at: string;
  subject: string;
  sender: SenderType;
  body: string;
  read: boolean;
  bookmarked: boolean;
  is_confirmed?: boolean;
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

export interface Connection {
  id: string;
  type: "gmail" | "outlook";
  accountName: string;
  userEmail?: string | null;
  isConnected: boolean;
  logo: string; // Use string instead of React.ReactNode
  logoAlt: string;
}

export interface Sender {
  id: string;
  name: string;
  email: string;
}
export interface EmailData {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

export interface AddSenderRequest {
  name: string;
  email: string;
  domain?: string;
  folder_id?: string;
  order?: number;
  subscribed?: boolean;
  count?: number;
}

export interface Preferences {
  font_size?: string;
  ai_prompt?: string;
  voice_speed?: string;
  selected_voice?: string;
}

export interface Tag {
  id: string;
  name: string;
  user_id: string;
}

export interface UpsertedTag {
  id: string;
  name: string;
}

export interface SupabaseUpsertResponse<T> {
  data: T[] | null;
  error: any;
}
