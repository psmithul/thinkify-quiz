import { Suspense } from 'react';
import { QuizStats } from './client';

type Params = Promise<{ quiz_id: string }>;

// Server Component
export default async function QuizStatsPage({ params }: { params: Params }) {
  const { quiz_id } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizStats quizId={quiz_id} />
    </Suspense>
  );
} 