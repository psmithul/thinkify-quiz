import { Suspense } from 'react';
import { Layout } from '@/components/Layout';
import ResultsClient from './client';
import { LoadingIndicator } from '@/components/LoadingIndicator';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Server Component
export default async function QuizResultsPage({ params }: PageProps) {
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