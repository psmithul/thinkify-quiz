import { Suspense } from 'react';
import { CreatorProfile } from './client';

type Params = Promise<{ creator_id: string }>;

// Server Component
export default async function CreatorPublicProfilePage({ params }: { params: Promise<Params> }) {
  const { creator_id } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatorProfile creatorId={creator_id} />
    </Suspense>
  );
} 