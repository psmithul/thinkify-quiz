import { Suspense } from 'react';
import { QuizEditor } from './client';

type Params = Promise<{ quiz_id: string }>;

// Server Component
export default async function EditQuizPage({ params }: { params: Params }) {
  const { quiz_id } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizEditor quizId={quiz_id} />
    </Suspense>
  );
} 