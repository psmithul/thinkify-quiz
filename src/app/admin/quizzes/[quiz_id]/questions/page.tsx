import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import QuestionsClient from './client';

type Params = Promise<{ quiz_id: string }>;

// Server Component
export default async function Page({ params }: { params: Params }) {
  const { quiz_id } = await params;
  
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    }>
      <QuestionsClient quizId={quiz_id} />
    </Suspense>
  );
} 