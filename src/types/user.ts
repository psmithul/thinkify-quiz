export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  bio?: string | null;
  profile_image?: string | null; // LinkedIn profile picture URL from OpenID Connect
  linkedin_url?: string | null;
  job_title?: string | null;
  location?: string | null;
  company?: string | null;
  industry?: string | null;
  phone?: string | null;
  website?: string | null;
  skills?: string[] | null;
  date_of_birth?: string | null;
  interests?: string[] | null;
  notification_preferences?: {
    email_updates: boolean;
    quiz_reminders: boolean;
    marketing: boolean;
  } | null;
  role: 'user' | 'creator' | 'admin';
  created_at?: string | null;
  updated_at?: string | null;
} 