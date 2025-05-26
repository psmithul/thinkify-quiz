import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import ResultsClient from './client';
import { LoadingIndicator } from '@/components/LoadingIndicator';

type Params = Promise<{ id: string }>;

// Server Component
export default async function QuizResultsPage({ params }: { params: Params }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={
      <Layout>
        <LoadingIndicator 
          size="lg" 
          message="Loading quiz results..."
        />
      </Layout>
    }>
      <ResultsClient quizId={id} />
    </Suspense>
  );
} 