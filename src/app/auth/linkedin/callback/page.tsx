import { Suspense } from 'react';
import LinkedInCallbackHandler from './handler';

export default function LinkedInCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing LinkedIn authentication...</p>
        </div>
      </div>
    }>
      <LinkedInCallbackHandler />
    </Suspense>
  );
} 