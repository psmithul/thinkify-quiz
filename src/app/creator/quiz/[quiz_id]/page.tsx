import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import QuizClient from './client';

// Type for page parameters
type Params = {
  params: {
    quiz_id: string;
  };
};

/**
 * Main page component for viewing a quiz as a creator
 */
export default function CreatorQuizPage({ params }: Params) {
  const { quiz_id } = params;
  
  return (
    <Suspense fallback={
      <Layout>
        <LoadingIndicator
          size="lg"
          message="Loading quiz details..."
          color="purple"
        />
      </Layout>
    }>
      <QuizClient quizId={quiz_id} />
    </Suspense>
  );
} 