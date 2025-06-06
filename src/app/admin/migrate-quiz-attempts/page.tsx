'use client';

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { migrateQuizAttempts } from '@/lib/migrate-quiz-attempts';

export default function MigrateQuizAttemptsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('Starting quiz attempts migration...');
      const migrationResult = await migrateQuizAttempts();
      
      if (migrationResult.success) {
        setResult('Migration completed successfully! Quiz attempts now have strict tracking.');
      } else {
        setError(`Migration failed: ${migrationResult.error}`);
      }
    } catch (err) {
      setError(`Migration error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Migrate Quiz Attempts</h1>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Migration Purpose</h3>
          <p className="text-yellow-700 text-sm">
            This migration ensures strict quiz attempt tracking by:
          </p>
          <ul className="list-disc list-inside text-yellow-700 text-sm mt-2 space-y-1">
            <li>Adding <code>is_started</code> column to track when quiz attempts begin</li>
            <li>Creating unique constraint to prevent duplicate attempts</li>
            <li>Cleaning up any existing duplicate records</li>
            <li>Adding performance indexes</li>
            <li>Ensuring one attempt per user per quiz policy</li>
          </ul>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-lg font-medium text-red-800 mb-2">⚠️ Important Notice</h3>
          <p className="text-red-700 text-sm">
            After this migration, users will only be able to attempt each quiz once. 
            Starting a quiz will immediately create a database record preventing retakes.
          </p>
        </div>

        {result && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-medium text-green-800 mb-2">✅ Success</h3>
            <p className="text-green-700 text-sm">{result}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="text-lg font-medium text-red-800 mb-2">❌ Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <Button
            onClick={runMigration}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running Migration...
              </>
            ) : (
              '🚀 Run Migration'
            )}
          </Button>
          
          <Button
            onClick={() => window.history.back()}
            variant="outline"
          >
            ← Back
          </Button>
        </div>
      </div>
    </Layout>
  );
} 