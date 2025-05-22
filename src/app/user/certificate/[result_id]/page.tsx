import { Suspense } from 'react';
import { ResultId } from './client';

// Server Component
export default async function CertificatePage({ params }: { params: { result_id: string } }) {
  const resultId = params.result_id;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultId resultId={resultId} />
    </Suspense>
  );
} 