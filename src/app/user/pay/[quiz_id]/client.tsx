'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/lib/authContext';

export default function PaymentClient({
  quizId
}: {
  quizId: string;
}) { 
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && !authLoading) {
      // Redirect to the quiz directly - no paywall
      router.push(`/user/quiz/${quizId}`);
    }
  }, [user, quizId, router, authLoading]);

  return (
    <Layout>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    </Layout>
  );
} 