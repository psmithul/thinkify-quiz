'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

export default function DebugLinkedInLoginPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const testLinkedInLogin = async () => {
    setIsLoading(true);
    setLogs([]);
    
    try {
      addLog('🔍 Starting LinkedIn OAuth debug test...');
      
      // Check environment variable
      const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
      addLog(`📋 Client ID: ${clientId ? clientId.substring(0, 10) + '...' : 'NOT SET'}`);
      
      if (!clientId || clientId === 'your_linkedin_client_id_here') {
        throw new Error('LinkedIn OAuth is not configured. Client ID missing or default value.');
      }
      
      // Test redirect URI
      const redirectUri = 'http://localhost:3001/auth/linkedin/callback';
      addLog(`🔗 Redirect URI: ${redirectUri}`);
      
      // Test scope
      const scope = 'openid profile email';
      addLog(`📝 Scopes: ${scope}`);
      
      // Generate state
      const state = Math.random().toString(36).substring(2, 15);
      addLog(`🎲 Generated state: ${state.substring(0, 5)}...`);
      
      // Store state
      sessionStorage.setItem('linkedin_oauth_state', state);
      addLog('💾 State stored in sessionStorage');
      
      // Build auth URL
      const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}`;
      
      addLog(`🌐 Auth URL built: ${linkedInAuthUrl.substring(0, 150)}...`);
      
      // Test if we can make a test fetch to our own server
      try {
        addLog('🧪 Testing server connectivity...');
        const testResponse = await fetch('/api/test-linkedin');
        addLog(`✅ Server test: ${testResponse.status} ${testResponse.statusText}`);
      } catch (serverError) {
        addLog(`❌ Server test failed: ${serverError}`);
      }
      
      addLog('🚀 Everything looks good! Ready to redirect to LinkedIn...');
      addLog('📌 In 3 seconds, will redirect to LinkedIn OAuth...');
      
      // Countdown
      for (let i = 3; i > 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLog(`⏰ Redirecting in ${i-1}...`);
      }
      
      addLog('🔄 Redirecting to LinkedIn now...');
      window.location.href = linkedInAuthUrl;
      
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const testEnvironment = () => {
    setLogs([]);
    addLog('🔍 Environment Variable Test');
    addLog('=====================================');
    
    // Check all LinkedIn-related env vars
    addLog(`NEXT_PUBLIC_LINKEDIN_CLIENT_ID: ${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || 'NOT SET'}`);
    
    // Check current URL
    addLog(`Current URL: ${window.location.href}`);
    
    // Check sessionStorage
    const storedState = sessionStorage.getItem('linkedin_oauth_state');
    addLog(`Stored OAuth state: ${storedState || 'NOT SET'}`);
    
    // Check if we can access the API
    fetch('/api/test-linkedin')
      .then(response => response.json())
      .then(data => {
        addLog(`✅ API accessible: ${JSON.stringify(data)}`);
      })
      .catch(error => {
        addLog(`❌ API error: ${error.message}`);
      });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">LinkedIn Login Debug</h1>
          
          <div className="space-y-4 mb-8">
            <Button onClick={testLinkedInLogin} isLoading={isLoading} variant="primary">
              Test LinkedIn OAuth Flow
            </Button>
            <Button onClick={testEnvironment} variant="outline">
              Test Environment
            </Button>
            <Button onClick={clearLogs} variant="outline">
              Clear Logs
            </Button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-semibold">Debug Console</h3>
              <span className="text-gray-400">{logs.length} entries</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-400">Click a test button to see debug output...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="py-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Expected Flow</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
              <li>Test LinkedIn OAuth Flow → Redirects to LinkedIn</li>
              <li>User grants permissions on LinkedIn</li>
              <li>LinkedIn redirects back to: <code>http://localhost:3001/auth/linkedin/callback</code></li>
              <li>Callback page processes the code and creates user account</li>
              <li>User is signed in and redirected to dashboard</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 