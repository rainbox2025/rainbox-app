export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  user_name?: string;
}
export interface Sender {
  id: string;
  name: string;
  email: string;
  domain?: string;
  user_id: string;
  created_at: string;
  folder_id?: string;
}
export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
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
