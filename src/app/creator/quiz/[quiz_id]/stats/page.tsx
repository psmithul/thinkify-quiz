import { Suspense } from 'react';
import { QuizStats } from './client';
import { Layout } from '@/components/Layout';
import { LoadingIndicator } from '@/components/LoadingIndicator';

type Params = Promise<{ quiz_id: string }>;

// Server Component
export default async function QuizStatsPage({ params }: { params: Params }) {
  const { quiz_id } = await params;
  
  return (
    <Suspense fallback={
      <Layout>
        <LoadingIndicator
          size="lg"
          message="Loading quiz statistics..."
          color="purple"
        />
      </Layout>
    }>
      <QuizStats quizId={quiz_id} />
    </Suspense>
  );
} 