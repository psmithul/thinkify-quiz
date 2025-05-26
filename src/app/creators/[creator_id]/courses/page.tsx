import { Suspense } from 'react';
import { CreatorCourses } from './client';

type Params = Promise<{ creator_id: string }>;

// Server Component
export default async function CreatorCoursesPage({ params }: { params: Promise<Params> }) {
  const { creator_id } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatorCourses creatorId={creator_id} />
    </Suspense>
  );
} 