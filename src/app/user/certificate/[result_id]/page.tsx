import { Suspense } from 'react';
import { ResultId } from './client';

type Params = Promise<{ result_id: string }>;

// Server Component
export default async function CertificatePage({ params }: { params: Params }) {
  const { result_id } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultId resultId={result_id} />
    </Suspense>
  );
} 