import Link from 'next/link';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="text-4xl">🧠</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Thinkify
              </h1>
            </div>
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-red-900">Authentication Failed</h2>
                <p className="text-red-700 mt-2">
                  We encountered an error while processing your LinkedIn authentication.
                </p>
                <p className="text-gray-600 text-sm mt-3">
                  This could be due to:
                </p>
                <ul className="text-gray-600 text-sm mt-2 text-left space-y-1">
                  <li>• Missing or invalid authorization code</li>
                  <li>• LinkedIn OAuth configuration issues</li>
                  <li>• Session timeout</li>
                  <li>• Network connectivity problems</li>
                </ul>
              </div>
              
              <div className="pt-4 space-y-3">
                <Link
                  href="/auth/login"
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200 inline-block text-center"
                >
                  Try Again
                </Link>
                
                <Link
                  href="/auth/signup"
                  className="w-full border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200 inline-block text-center"
                >
                  Sign Up Instead
                </Link>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-gray-500 text-xs">
                  If this problem persists, please contact support or try using email authentication instead.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 