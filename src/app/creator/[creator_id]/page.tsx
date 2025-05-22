import { Suspense } from 'react';
import { CreatorPublicProfile } from './public-profile';

// Server Component
export default async function CreatorPublicProfilePage({ params }: { params: { creator_id: string } }) {
  const creatorId = params.creator_id;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatorPublicProfile creatorId={creatorId} />
    </Suspense>
  );
} 