'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

export default function UserProfile() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) return;

      try {
        // Fetch user's profile
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        setFullName(data.full_name || '');
        setBio(data.bio || '');
        setJobTitle(data.job_title || '');
        setLocation(data.location || '');
        setSkills(data.skills || '');
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          bio: bio,
          job_title: jobTitle,
          location: location,
          skills: skills,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);
        
      if (error) throw error;
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/user/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 p-4 rounded-md"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 p-4 rounded-md"
          >
            <p className="text-sm text-green-600">{success}</p>
          </motion.div>
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg p-6 border border-gray-200"
        >
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <input
                type="text"
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. Software Developer"
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                Skills
              </label>
              <input
                type="text"
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g. JavaScript, React, Node.js"
              />
              <p className="mt-1 text-xs text-gray-500">Separate skills with commas</p>
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Tell us about yourself"
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={isSaving}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </motion.div>
        
        {/* Profile Preview Section */}
        {fullName && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white shadow rounded-lg p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Preview</h2>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-purple-800">
                  {fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{fullName}</h3>
                {jobTitle && <p className="text-gray-600">{jobTitle}</p>}
                {location && <p className="text-gray-500 text-sm">{location}</p>}
              </div>
            </div>
            
            {skills && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {skills.split(',').map((skill, index) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {bio && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                <p className="text-gray-600">{bio}</p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
} 