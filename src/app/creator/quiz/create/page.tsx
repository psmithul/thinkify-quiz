'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateQuizRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/creator/quiz/new');
  }, [router]);

  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
} 