import { Suspense } from 'react';
import { CreatorPublicProfile } from './public-profile';

type Params = Promise<{ creator_id: string }>;

// Server Component
export default async function CreatorPublicProfilePage({ params }: { params: Params }) {
  const { creator_id } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatorPublicProfile creatorId={creator_id} />
    </Suspense>
  );
} 