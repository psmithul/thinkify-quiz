'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';

export default function TestLinkedInPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<string | null>(null);

  useEffect(() => {
    // Check if we got redirected back with a code
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('code');
      const error = urlParams.get('error');
      const state = urlParams.get('state');
      
      setAuthCode(urlCode);
      setAuthError(error);
      setAuthState(state);
      
      if (urlCode && !code) {
        setCode(urlCode);
      }
    }
  }, []);

  const startLinkedInAuth = () => {
    if (typeof window === 'undefined') return;
    
    const clientId = '865iwdnmx2n4fy'; // Your client ID
    const redirectUri = 'http://localhost:3001/test-linkedin'; // Different redirect for testing
    const scope = 'openid profile email';
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state for verification
    sessionStorage.setItem('linkedin_test_state', state);
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`;
    
    console.log('Starting LinkedIn OAuth test with URL:', authUrl);
    window.location.href = authUrl;
  };

  const testTokenExchange = async () => {
    if (!code) {
      alert('Please enter an authorization code first');
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code,
          redirect_uri: 'http://localhost:3001/test-linkedin' // Match the redirect URI used to get the code
        }),
      });

      const result = await response.json();
      setTestResult({
        status: response.status,
        data: result
      });
      
      console.log('Test result:', result);
    } catch (error) {
      setTestResult({
        status: 'ERROR',
        data: { error: 'Network error', details: error }
      });
      console.error('Test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fill code if we got one from URL
  useEffect(() => {
    if (authCode && !code) {
      setCode(authCode);
    }
  }, [authCode, code]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">LinkedIn OAuth Test</h1>
          
          <div className="space-y-6">
            {/* OAuth URL Test */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Step 1: Test Authorization</h2>
              <p className="text-gray-600 mb-4">
                This will redirect you to LinkedIn for authorization and bring you back to this page.
              </p>
              <Button onClick={startLinkedInAuth} variant="primary">
                Start LinkedIn OAuth Test
              </Button>
            </div>

            {/* Show auth response */}
            {(authCode || authError) && (
              <div className="border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Authorization Response</h2>
                {authError ? (
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <p className="text-red-800 font-semibold">❌ Authorization Error:</p>
                    <p className="text-red-700">{authError}</p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded p-4">
                    <p className="text-green-800 font-semibold">✅ Authorization Code Received:</p>
                    <p className="text-green-700 text-sm font-mono break-all">{authCode}</p>
                    <p className="text-green-600 text-sm mt-2">State: {authState}</p>
                  </div>
                )}
              </div>
            )}

            {/* Token Exchange Test */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Step 2: Test Token Exchange</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Authorization Code
                  </label>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste the authorization code from LinkedIn here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={testTokenExchange}
                  isLoading={isLoading}
                  disabled={!code}
                  variant="primary"
                >
                  Test Token Exchange
                </Button>
              </div>
            </div>

            {/* Test Results */}
            {testResult && (
              <div className="border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Test Results</h2>
                <div className={`rounded p-4 ${
                  testResult.status === 200 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`font-semibold ${
                    testResult.status === 200 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Status: {testResult.status}
                  </p>
                  <pre className={`text-sm mt-2 whitespace-pre-wrap ${
                    testResult.status === 200 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Configuration Info */}
            <div className="border rounded-lg p-6 bg-blue-50">
              <h2 className="text-xl font-semibold mb-4">Configuration Info</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Client ID:</strong> 865iwdnmx2n4fy</p>
                <p><strong>Redirect URI:</strong> http://localhost:3001/test-linkedin</p>
                <p><strong>Scopes:</strong> openid profile email</p>
                <p><strong>Token Endpoint:</strong> https://www.linkedin.com/oauth/v2/accessToken</p>
                <p><strong>UserInfo Endpoint:</strong> https://api.linkedin.com/v2/userinfo</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="border rounded-lg p-6 bg-yellow-50">
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click "Start LinkedIn OAuth Test" to begin authorization</li>
                <li>You'll be redirected to LinkedIn to grant permissions</li>
                <li>After authorization, you'll be redirected back here with a code</li>
                <li>The authorization code will be automatically filled in</li>
                <li>Click "Test Token Exchange" to test the backend API</li>
                <li>Check the console and results for detailed debug information</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 