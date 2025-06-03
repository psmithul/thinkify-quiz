import Link from 'next/link';
import { ErrorFallback } from '@/components/ErrorFallback';

export default function NotFound() {
  const notFoundError = new Error('The page you\'re looking for doesn\'t exist or has been moved.');
  notFoundError.name = 'NotFoundError';

  return (
    <ErrorFallback
      error={notFoundError}
      showDetails={false}
      autoRetry={false}
      redirectDelay={0} // No auto redirect for 404s
    >
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Page Not Found</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Popular pages:</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Link href="/browse" className="text-blue-600 hover:underline">Browse Courses</Link>
            <span>•</span>
            <Link href="/auth/signup" className="text-blue-600 hover:underline">Sign Up</Link>
            <span>•</span>
            <Link href="/auth/signin" className="text-blue-600 hover:underline">Sign In</Link>
            <span>•</span>
            <Link href="/contact" className="text-blue-600 hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </ErrorFallback>
  );
} 