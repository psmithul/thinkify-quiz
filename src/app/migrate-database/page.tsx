'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

export default function MigrateDatabasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/migrate-category', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult('✅ Database migration completed successfully! You can now create quizzes with categories.');
      } else {
        setError(`❌ Migration failed: ${data.error}`);
      }
    } catch (err) {
      setError(`❌ Migration failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Migration</h1>
          <p className="text-gray-600">
            Add the missing category column to your quizzes table
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">What this migration does:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Adds the <code className="bg-blue-100 px-1 rounded">category</code> column to the quizzes table</li>
              <li>• Adds the <code className="bg-blue-100 px-1 rounded">time_limit_minutes</code> column</li>
              <li>• Adds the <code className="bg-blue-100 px-1 rounded">tier_thresholds</code> column</li>
              <li>• Sets default category 'General' for existing quizzes</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Alternative: Manual SQL</h3>
            <p className="text-sm text-yellow-700 mb-3">
              You can also run this SQL directly in your Supabase SQL Editor:
            </p>
            <pre className="bg-yellow-100 p-3 rounded text-xs text-yellow-800 overflow-x-auto">
{`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS tier_thresholds JSONB;
UPDATE quizzes SET category = 'General' WHERE category IS NULL;`}
            </pre>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700">{result}</p>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={runMigration}
              isLoading={isLoading}
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? 'Running Migration...' : '🚀 Run Database Migration'}
            </Button>
          </div>

          <div className="text-center">
            <a 
              href="/creator/quiz/new" 
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Quiz Creation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 