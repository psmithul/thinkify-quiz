import { Suspense } from 'react';
import { QuizStats } from './client';

// Server Component
export default async function QuizStatsPage({ params }: { params: { quiz_id: string } }) {
  const quizId = params.quiz_id;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizStats quizId={quizId} />
    </Suspense>
  );
} 