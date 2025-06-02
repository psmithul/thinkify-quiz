export interface User {
  id: string;
  email: string;
  full_name: string;
  bio?: string;
  profile_image?: string;
  linkedin_url?: string;
  job_title?: string;
  location?: string;
  company?: string;
  industry?: string;
  phone?: string;
  website?: string;
  skills?: string[];
  role: 'user' | 'creator' | 'admin';
  created_at?: string;
  updated_at?: string;
} 