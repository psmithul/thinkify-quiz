import { Suspense } from 'react';
import { CreatorProfile } from './client';

// Server Component
export default async function CreatorProfilePage({ params }: { params: { creator_id: string } }) {
  const creatorId = params.creator_id;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatorProfile creatorId={creatorId} />
    </Suspense>
  );
} 