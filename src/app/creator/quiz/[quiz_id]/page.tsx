import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import QuizClient from './client';

type Params = Promise<{ quiz_id: string }>;

// Server Component
export default async function Page({ params }: { params: Promise<Params> }) {
  const { quiz_id } = await params;
  
  return (
    <Suspense fallback={
      <Layout>
        <LoadingIndicator
          size="lg"
          message="Loading quiz details..."
        />
      </Layout>
    }>
      <QuizClient quizId={quiz_id} />
    </Suspense>
  );
} 