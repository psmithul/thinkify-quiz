'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function MakeMeCreatorPage() {
  const { user, userData, isLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      setUserId(user.id);
    }
  }, [isLoading, user, router]);

  const makeMeCreator = async () => {
    try {
      setStatus('loading');
      setMessage('Making you a creator...');
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      console.log('Making user a creator:', userId);
      
      // Update the user's role in the database
      const { error } = await supabase
        .from('users')
        .update({ role: 'creator' })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating role:', error);
        throw error;
      }
      
      setStatus('success');
      setMessage('You are now a creator! Redirecting to creator dashboard...');
      
      // Force a reload to update the auth context
      setTimeout(() => {
        window.location.href = '/creator/dashboard';
      }, 2000);
    } catch (err) {
      console.error('Error making user a creator:', err);
      setStatus('error');
      setMessage(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (isLoading) {
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
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Become a Creator</h1>
        
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Make Me a Creator</h2>
            <p className="text-gray-600">
              Click the button below to upgrade your account to a creator account. This will allow you to create and publish quizzes.
            </p>
            
            <div className="flex flex-col space-y-2">
              <div className="text-sm text-gray-600">
                <strong>User ID:</strong> {userId}
              </div>
              
              <div className="text-sm text-gray-600">
                <strong>Current Role:</strong> {userData?.role || 'Not set'}
              </div>
              
              <Button 
                onClick={makeMeCreator}
                disabled={status === 'loading' || status === 'success'}
                fullWidth
              >
                {status === 'loading' ? 'Processing...' : 'Make Me a Creator'}
              </Button>
            </div>
            
            {message && (
              <div className={`p-4 rounded-md ${
                status === 'error' ? 'bg-red-50 text-red-700' : 
                status === 'success' ? 'bg-green-50 text-green-700' : 
                'bg-blue-50 text-blue-700'
              }`}>
                <p>{message}</p>
              </div>
            )}
            
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
              >
                Go Back Home
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Alternative Method</h2>
          <p className="text-gray-600 mb-4">
            If the button above doesn't work, you can run the following SQL in the Supabase SQL Editor:
          </p>
          
          <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-auto">
            {`UPDATE users SET role = 'creator' WHERE id = '${userId}';`}
          </div>
        </div>
      </div>
    </Layout>
  );
} 