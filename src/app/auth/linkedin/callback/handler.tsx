'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface LinkedInProfileData {
  id: string;
  email: string;
  full_name: string;
  profile_image?: string;
  linkedin_url?: string;
  role: string;
  job_title?: string;
  location?: string;
  bio?: string;
  company?: string;
  industry?: string;
  phone?: string;
  website?: string;
  skills?: string[];
  created_at: string;
  updated_at: string;
}

export default function LinkedInCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'profile-completion'>('loading');
  const [message, setMessage] = useState('Processing LinkedIn authentication...');
  const [linkedinData, setLinkedinData] = useState<LinkedInProfileData | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Extract comprehensive LinkedIn profile data
  const extractLinkedInData = (user: any): LinkedInProfileData => {
    const userMetadata = user.user_metadata || {};
    console.log('Raw LinkedIn user metadata:', userMetadata);
    
    // Extract full name with multiple fallbacks
    const fullName = userMetadata.full_name || 
                    userMetadata.name || 
                    (userMetadata.given_name && userMetadata.family_name ? 
                     `${userMetadata.given_name} ${userMetadata.family_name}` : '') ||
                    userMetadata.first_name + ' ' + userMetadata.last_name ||
                    user.email?.split('@')[0] || 
                    'LinkedIn User';

    // Extract profile image with fallbacks
    const profileImage = userMetadata.picture || 
                        userMetadata.avatar_url ||
                        userMetadata.profile_picture ||
                        userMetadata.image_url;

    // Extract job title and company info
    const jobTitle = userMetadata.job_title || 
                    userMetadata.headline ||
                    userMetadata.title ||
                    userMetadata.position;

    const company = userMetadata.company || 
                   userMetadata.organization ||
                   userMetadata.current_company;

    // Extract location
    const location = userMetadata.location || 
                    userMetadata.locality ||
                    userMetadata.region ||
                    (userMetadata.country ? userMetadata.country : '');

    // Extract bio/summary
    const bio = userMetadata.summary || 
               userMetadata.bio ||
               userMetadata.description ||
               userMetadata.about;

    // Extract additional fields
    const industry = userMetadata.industry;
    const phone = userMetadata.phone || userMetadata.phone_number;
    const website = userMetadata.website || userMetadata.website_url;
    const skills = userMetadata.skills || (userMetadata.specialties ? userMetadata.specialties.split(',') : []);

    // Create LinkedIn profile URL if available
    const linkedinUrl = userMetadata.linkedin_url || 
                       userMetadata.profile_url ||
                       (userMetadata.vanity_name ? `https://linkedin.com/in/${userMetadata.vanity_name}` : '');

    return {
      id: user.id,
      email: user.email!,
      full_name: fullName.trim(),
      profile_image: profileImage,
      linkedin_url: linkedinUrl,
      role: 'user', // Will be set properly later
      job_title: jobTitle,
      location: location,
      bio: bio,
      company: company,
      industry: industry,
      phone: phone,
      website: website,
      skills: Array.isArray(skills) ? skills : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  // Check which essential fields are missing
  const checkMissingFields = (data: LinkedInProfileData): string[] => {
    const missing: string[] = [];
    
    if (!data.full_name || data.full_name.trim().length < 2) {
      missing.push('full_name');
    }
    
    // Optional but recommended fields
    if (!data.bio) missing.push('bio');
    if (!data.job_title) missing.push('job_title');
    if (!data.location) missing.push('location');
    
    return missing;
  };

  useEffect(() => {
    async function handleLinkedInCallback() {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        console.log('LinkedIn callback received:', {
          code: code ? code.substring(0, 10) + '...' : null,
          error,
          fullUrl: typeof window !== 'undefined' ? window.location.href : 'SSR'
        });
        
        if (error) {
          throw new Error(`LinkedIn OAuth error: ${error}`);
        }
        
        if (!code) {
          throw new Error('Missing authorization code');
        }
        
        console.log('Exchanging code for session with Supabase...');
        setMessage('Exchanging authorization code for session...');
        
        // Use Supabase's built-in code exchange
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('Code exchange failed:', exchangeError);
          throw exchangeError;
        }
        
        if (!data.user) {
          throw new Error('No user data received from LinkedIn');
        }
        
        setMessage('Processing your LinkedIn profile data...');
        
        // Check if user came from creator signup
        let isCreatorSignup = false;
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          isCreatorSignup = document.referrer.includes('/auth/creator-signup') || 
                           window.localStorage.getItem('linkedin_creator_signup') === 'true';
          
          // Clear localStorage flag if it exists
          window.localStorage.removeItem('linkedin_creator_signup');
        }
        
        // Extract comprehensive LinkedIn profile data
        const extractedData = extractLinkedInData(data.user);
        extractedData.role = isCreatorSignup ? 'creator' : 'user';
        
        console.log('Extracted LinkedIn data:', extractedData);
        
        // Check what fields are missing
        const missing = checkMissingFields(extractedData);
        
        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        let userData;

        if (existingUser) {
          // User exists, update their profile with latest LinkedIn data
          console.log('Updating existing user profile with LinkedIn data...');
          
          const updateData: any = {
            full_name: extractedData.full_name,
            updated_at: extractedData.updated_at
          };
          
          // Only update fields that have values
          if (extractedData.profile_image) updateData.profile_image = extractedData.profile_image;
          if (extractedData.linkedin_url) updateData.linkedin_url = extractedData.linkedin_url;
          if (extractedData.job_title) updateData.job_title = extractedData.job_title;
          if (extractedData.location) updateData.location = extractedData.location;
          if (extractedData.bio) updateData.bio = extractedData.bio;
          if (extractedData.company) updateData.company = extractedData.company;
          if (extractedData.industry) updateData.industry = extractedData.industry;
          if (extractedData.phone) updateData.phone = extractedData.phone;
          if (extractedData.website) updateData.website = extractedData.website;
          
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', data.user.id)
            .select()
            .single();

          if (updateError) {
            console.warn('Profile update failed, but continuing:', updateError);
            userData = existingUser; // Use existing data if update fails
          } else {
            userData = updatedUser;
          }
        } else {
          // User doesn't exist, create new profile
          console.log('Creating new user profile with LinkedIn data...');
          
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([extractedData])
            .select()
            .single();

          if (insertError) {
            console.warn('Profile creation failed, creating minimal profile:', insertError);
            // Create minimal profile
            const minimalProfile = {
              id: extractedData.id,
              email: extractedData.email,
              full_name: extractedData.full_name,
              role: extractedData.role,
              created_at: extractedData.created_at,
              updated_at: extractedData.updated_at
            };
            
            const { data: minimalUser, error: minimalError } = await supabase
              .from('users')
              .insert([minimalProfile])
              .select()
              .single();
              
            if (minimalError) {
              throw minimalError;
            }
            userData = minimalUser;
          } else {
            userData = newUser;
          }
        }
        
        console.log('User profile processed successfully:', userData);
        
        // Store the LinkedIn data for potential profile completion
        setLinkedinData(extractedData);
        
        // If we have missing non-critical fields, show profile completion
        if (missing.length > 0 && missing.some(field => field !== 'full_name')) {
          setMissingFields(missing);
          setStatus('profile-completion');
          setMessage('Complete your profile with additional information');
        } else {
          // All essential data is present, redirect to dashboard
          setStatus('success');
          setMessage(`LinkedIn authentication successful! Welcome to Thinkify${userData.role === 'creator' ? ' as a creator' : ''}!`);
          
          // Determine redirect based on user role
          const redirectUrl = userData.role === 'admin' ? '/admin/dashboard' : 
                             userData.role === 'creator' ? '/creator/dashboard' : 
                             '/user/dashboard';
          
          console.log('Redirecting to:', redirectUrl);
          
          // Redirect to appropriate dashboard
          setTimeout(() => {
            router.push(redirectUrl);
          }, 2000);
        }
        
      } catch (err) {
        console.error('LinkedIn callback error:', err);
        
        let errorMessage = 'Failed to process LinkedIn authentication';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setStatus('error');
        setMessage(errorMessage);
        
        // Redirect to login page after error
        setTimeout(() => {
          router.push('/auth/login?error=' + encodeURIComponent(errorMessage));
        }, 5000);
      }
    }
    
    // Only run if we have the necessary parameters
    if (searchParams.get('code') || searchParams.get('error')) {
      handleLinkedInCallback();
    } else {
      // Redirect to login if we're on this page without callback parameters
      router.push('/auth/login');
    }
  }, [searchParams, router]);

  // Handle profile completion form submission
  const handleProfileCompletion = async (formData: any) => {
    if (!linkedinData) return;
    
    try {
      setStatus('loading');
      setMessage('Updating your profile...');
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Update only the fields that were filled in the form
      Object.keys(formData).forEach(key => {
        if (formData[key] && formData[key].trim()) {
          updateData[key] = formData[key].trim();
        }
      });
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', linkedinData.id);
      
      if (error) {
        console.warn('Profile completion update failed:', error);
      }
      
      setStatus('success');
      setMessage(`Profile completed! Welcome to Thinkify${linkedinData.role === 'creator' ? ' as a creator' : ''}!`);
      
      // Determine redirect based on user role
      const redirectUrl = linkedinData.role === 'admin' ? '/admin/dashboard' : 
                         linkedinData.role === 'creator' ? '/creator/dashboard' : 
                         '/user/dashboard';
      
      setTimeout(() => {
        router.push(redirectUrl);
      }, 2000);
      
    } catch (err) {
      console.error('Profile completion error:', err);
      setStatus('error');
      setMessage('Failed to complete profile. Redirecting to dashboard...');
      
      // Still redirect even if update fails
      setTimeout(() => {
        const redirectUrl = linkedinData.role === 'admin' ? '/admin/dashboard' : 
                           linkedinData.role === 'creator' ? '/creator/dashboard' : 
                           '/user/dashboard';
        router.push(redirectUrl);
      }, 3000);
    }
  };

  // Skip profile completion and go directly to dashboard
  const handleSkipCompletion = () => {
    if (!linkedinData) return;
    
    const redirectUrl = linkedinData.role === 'admin' ? '/admin/dashboard' : 
                       linkedinData.role === 'creator' ? '/creator/dashboard' : 
                       '/user/dashboard';
    
    router.push(redirectUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="text-4xl">🧠</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Thinkify
              </h1>
            </div>
            
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin"></div>
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{message}</p>
                  <p className="text-gray-600 mt-2">Please wait while we complete your LinkedIn authentication...</p>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-900">{message}</p>
                  <p className="text-green-700 mt-2">Your LinkedIn profile has been imported successfully!</p>
                  <p className="text-gray-600 text-sm mt-2">Redirecting to your dashboard...</p>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-900">Authentication Failed</p>
                  <p className="text-red-700 mt-2">{message}</p>
                  <p className="text-gray-600 text-sm mt-4">You will be redirected to the login page shortly...</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}
            
            {status === 'profile-completion' && linkedinData && (
              <ProfileCompletionForm
                linkedinData={linkedinData}
                missingFields={missingFields}
                onComplete={handleProfileCompletion}
                onSkip={handleSkipCompletion}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile completion form component
interface ProfileCompletionFormProps {
  linkedinData: LinkedInProfileData;
  missingFields: string[];
  onComplete: (formData: any) => void;
  onSkip: () => void;
}

function ProfileCompletionForm({ linkedinData, missingFields, onComplete, onSkip }: ProfileCompletionFormProps) {
  const [formData, setFormData] = useState({
    bio: linkedinData.bio || '',
    job_title: linkedinData.job_title || '',
    location: linkedinData.location || '',
    company: linkedinData.company || '',
    industry: linkedinData.industry || '',
    phone: linkedinData.phone || '',
    website: linkedinData.website || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-600 text-sm mb-4">
          We've imported your LinkedIn data. Please fill in any missing information or update existing details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Show LinkedIn imported data */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-900 mb-1">✅ Imported from LinkedIn:</p>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Name: {linkedinData.full_name}</li>
            <li>• Email: {linkedinData.email}</li>
            {linkedinData.profile_image && <li>• Profile Photo</li>}
            {linkedinData.linkedin_url && <li>• LinkedIn Profile URL</li>}
          </ul>
        </div>

        {/* Bio */}
        {missingFields.includes('bio') && (
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio {formData.bio ? '(from LinkedIn)' : '(Missing)'}
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder="Tell us about yourself..."
            />
          </div>
        )}

        {/* Job Title */}
        {missingFields.includes('job_title') && (
          <div>
            <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title {formData.job_title ? '(from LinkedIn)' : '(Missing)'}
            </label>
            <input
              type="text"
              id="job_title"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder="Your current job title"
            />
          </div>
        )}

        {/* Location */}
        {missingFields.includes('location') && (
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location {formData.location ? '(from LinkedIn)' : '(Missing)'}
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder="City, Country"
            />
          </div>
        )}

        {/* Company */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company {formData.company ? '(from LinkedIn)' : '(Optional)'}
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Your current company"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            placeholder="Your phone number"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium transition-colors"
          >
            Complete Profile
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      </form>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          You can always update your profile information later from your account settings.
        </p>
      </div>
    </div>
  );
} 