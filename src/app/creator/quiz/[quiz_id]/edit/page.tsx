import { Suspense } from 'react';
import { QuizEditor } from './client';

// Server Component
export default async function EditQuizPage({ params }: { params: { quiz_id: string } }) {
  const quizId = params.quiz_id;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizEditor quizId={quizId} />
    </Suspense>
  );
} 