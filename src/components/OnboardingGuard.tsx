'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';
import { User } from '@/types/user';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

interface OnboardingFormData {
  full_name: string;
  bio: string;
  job_title: string;
  location: string;
  company: string;
  linkedin_url: string;
  phone: string;
}

// Define required fields for profile completion (LinkedIn URL removed as optional)
const REQUIRED_FIELDS = ['full_name', 'bio', 'job_title', 'location', 'company', 'phone'] as const;
const OPTIONAL_FIELDS = ['linkedin_url'] as const;

// Helper function to check if profile is complete
function isProfileComplete(userData: User | null): boolean {
  if (!userData) return false;
  
  // Check only REQUIRED fields are present and not empty
  return REQUIRED_FIELDS.every(field => {
    const value = userData[field];
    return value && typeof value === 'string' && value.trim().length >= 2;
  });
}

// Helper function to get completion percentage
function getProfileCompletion(userData: User | null): number {
  if (!userData) return 0;
  
  const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
  const completedFields = allFields.filter(field => {
    const value = userData[field];
    return value && typeof value === 'string' && value.trim().length >= 2;
  });
  
  return Math.round((completedFields.length / allFields.length) * 100);
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, userData, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    full_name: '',
    bio: '',
    job_title: '',
    location: '',
    company: '',
    linkedin_url: '',
    phone: ''
  });

  // Handle tab visibility to prevent unnecessary operations when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Check if user needs onboarding - FIXED: Removed hasCheckedOnboarding from dependencies to prevent infinite loop
  useEffect(() => {
    // Only run when tab is visible and we have user data
    if (!isTabVisible || authLoading || !user) {
      return;
    }

    // Prevent multiple checks
    if (hasCheckedOnboarding) {
      return;
    }

    const checkOnboardingNeeded = () => {
      // Set a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn('Onboarding check timeout, allowing access');
        setHasCheckedOnboarding(true);
        setShowOnboarding(false);
      }, 3000); // 3 second timeout

      try {
        if (!userData) {
          clearTimeout(timeoutId);
          setHasCheckedOnboarding(true);
          return;
        }

        const needsOnboarding = !isProfileComplete(userData);
        const completionPercentage = getProfileCompletion(userData);
        
        console.log('Profile completion check:', {
          userId: user.id,
          email: user.email,
          fullName: userData.full_name,
          jobTitle: userData.job_title,
          location: userData.location,
          bio: userData.bio,
          company: userData.company,
          linkedinUrl: userData.linkedin_url,
          phone: userData.phone,
          isComplete: isProfileComplete(userData),
          completionPercentage,
          needsOnboarding
        });
        
        if (needsOnboarding) {
          setShowOnboarding(true);
          // Pre-fill with any existing data
          setFormData(prev => ({
            ...prev,
            full_name: userData.full_name || '',
            bio: userData.bio || '',
            job_title: userData.job_title || '',
            location: userData.location || '',
            company: userData.company || '',
            linkedin_url: userData.linkedin_url || '',
            phone: userData.phone || ''
          }));
        } else {
          setShowOnboarding(false);
          console.log('✅ Profile is complete, allowing app access');
        }
        
        clearTimeout(timeoutId);
        setHasCheckedOnboarding(true);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        clearTimeout(timeoutId);
        setHasCheckedOnboarding(true);
        setShowOnboarding(false);
      }
    };

    checkOnboardingNeeded();
  }, [user, userData, authLoading, isTabVisible]); // Removed hasCheckedOnboarding from dependencies

  // Reset check flag when user changes
  useEffect(() => {
    if (!user) {
      setHasCheckedOnboarding(false);
      setShowOnboarding(false);
    }
  }, [user?.id]); // Only trigger when user ID changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info (Required)
        return formData.full_name.trim().length >= 2 && 
               formData.job_title.trim().length >= 2 &&
               formData.location.trim().length >= 2;
      case 2: // Professional Info (Required)
        return formData.bio.trim().length >= 10 && 
               formData.company.trim().length >= 2;
      case 3: // Contact Info (Phone required, LinkedIn optional)
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const phoneValid = phoneRegex.test(formData.phone.trim());
        
        // LinkedIn URL validation only if provided (optional)
        if (formData.linkedin_url.trim()) {
          const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
          return phoneValid && linkedinRegex.test(formData.linkedin_url.trim());
        }
        
        return phoneValid;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setError(getStepError(currentStep));
      return;
    }
    
    setError(null);
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepError = (step: number): string => {
    switch (step) {
      case 1:
        return 'Please fill in all required fields: Full Name, Job Title, and Location (at least 2 characters each)';
      case 2:
        return 'Please fill in your Bio (at least 10 characters) and Company (at least 2 characters)';
      case 3:
        return 'Please enter a valid Phone Number. LinkedIn URL is optional but must be valid if provided (e.g., https://linkedin.com/in/yourname)';
      default:
        return 'Please fill in the required information';
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!user) return;

    setIsUpdating(true);
    setError(null);

    try {
      // Clean and prepare data - all fields are required
      const updateData = {
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        job_title: formData.job_title.trim(),
        location: formData.location.trim(),
        company: formData.company.trim(),
        linkedin_url: formData.linkedin_url.trim(),
        phone: formData.phone.trim(),
        updated_at: new Date().toISOString()
      };

      console.log('Updating user profile with complete data:', updateData);

      // Update user profile in database
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      if (!updatedUser) {
        throw new Error('Failed to update profile - no data returned');
      }

      console.log('✅ Profile completed successfully:', updatedUser);
      
      // Hide onboarding and reset state properly
      setShowOnboarding(false);
      setHasCheckedOnboarding(false);
      
      // Force a clean re-check of profile completion
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 100);
      
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(formatErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // If no user or user doesn't need onboarding, show children
  if (!user || !showOnboarding) {
    return <>{children}</>;
  }

  // Calculate completion percentage for display
  const tempUserData = { ...userData, ...formData } as User;
  const completionPercentage = getProfileCompletion(tempUserData);

  // Show onboarding flow
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">🚀</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
              <p className="text-gray-600">All fields are required to access Thinkify</p>
              
              {/* Progress indicator */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Step {currentStep} of 3</span>
                  <span>{Math.round((currentStep / 3) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Profile completion indicator */}
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-700">
                  Profile Completion: <span className="font-semibold">{completionPercentage}%</span>
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">❌</span>
                  <div>
                    <p className="font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step content */}
            <div className="space-y-6">
              {currentStep === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information <span className="text-red-500">*</span></h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="w-full"
                        autoFocus
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="job_title"
                        name="job_title"
                        type="text"
                        required
                        value={formData.job_title}
                        onChange={handleInputChange}
                        placeholder="e.g., Software Engineer, Product Manager"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="location"
                        name="location"
                        type="text"
                        required
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., New York, NY or Remote"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    <span className="text-red-500">*</span> All fields are required to complete your profile
                  </p>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Professional Information <span className="text-red-500">*</span></h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        required
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself, your experience, and interests (minimum 10 characters)..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.bio.length}/10 characters minimum
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="company"
                        name="company"
                        type="text"
                        required
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Your current company or organization"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    This information helps us provide personalized content and networking opportunities
                  </p>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Contact Information <span className="text-red-500">*</span></h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1234567890"
                        className="w-full"
                        autoFocus
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Include country code (e.g., +1 for US) - Required
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn Profile <span className="text-gray-400">(Optional)</span>
                      </label>
                      <Input
                        id="linkedin_url"
                        name="linkedin_url"
                        type="url"
                        value={formData.linkedin_url}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/yourprofile (optional)"
                        className="w-full"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Optional - Add this later in your profile if you prefer
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Phone number is required for important notifications. LinkedIn profile is optional for professional networking.
                  </p>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <Button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={isUpdating}
                >
                  Back
                </Button>
              )}
              
              <Button
                type="button"
                onClick={handleNext}
                disabled={isUpdating || !validateStep(currentStep)}
                isLoading={isUpdating}
                className="flex-1 bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400"
              >
                {currentStep === 3 ? 'Complete Profile' : 'Continue'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 