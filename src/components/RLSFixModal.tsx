'use client';

import { useState } from 'react';

interface RLSFixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RLSFixModal({ isOpen, onClose }: RLSFixModalProps) {
  const [sqlCopied, setSqlCopied] = useState(false);

  const fixRLSSQL = `-- Fix RLS policies for payment_verifications table

-- First, ensure RLS is enabled
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Users can insert own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can update payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can view all payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins full access" ON payment_verifications;

-- Create comprehensive admin policy
CREATE POLICY "Admins full access" ON payment_verifications
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create user policies for regular users
CREATE POLICY "Users can view own payment verifications" ON payment_verifications
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment verifications" ON payment_verifications
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON payment_verifications TO authenticated;
GRANT UPDATE, DELETE ON payment_verifications TO authenticated;`;

  const handleCopySQL = async () => {
    try {
      await navigator.clipboard.writeText(fixRLSSQL);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-red-600">Database Access Issue</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              The payment verification table exists but access is blocked by Row Level Security (RLS) policies.
            </p>
            <p className="text-gray-700 mb-4">
              To fix this issue, please run the following SQL in your <strong>Supabase SQL Editor</strong>:
            </p>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">SQL Commands:</label>
              <button
                onClick={handleCopySQL}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  sqlCopied
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                {sqlCopied ? '✓ Copied!' : 'Copy SQL'}
              </button>
            </div>
            <textarea
              readOnly
              value={fixRLSSQL}
              className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">Steps to fix:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Open your <strong>Supabase Dashboard</strong></li>
              <li>Navigate to the <strong>SQL Editor</strong></li>
              <li>Copy and paste the SQL commands above</li>
              <li>Click <strong>Run</strong> to execute the commands</li>
              <li>Refresh this page to see if the issue is resolved</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <h3 className="font-medium text-yellow-900 mb-2">⚠️ Important Notes:</h3>
            <ul className="list-disc list-inside text-yellow-800 space-y-1">
              <li>Make sure you are logged in as an admin user</li>
              <li>Ensure your user record in the database has <code>role = 'admin'</code></li>
              <li>These policies control who can access payment verification data</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 