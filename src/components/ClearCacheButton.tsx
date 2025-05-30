'use client';

import { useState } from 'react';
import { Button } from './Button';
import { clearCacheAndReload } from '@/utils/performance';

export function ClearCacheButton() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = () => {
    setIsClearing(true);
    
    // Show a brief message before clearing
    setTimeout(() => {
      clearCacheAndReload();
    }, 500);
  };

  // Only show in development or if there are console errors
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleClearCache}
        disabled={isClearing}
        className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2"
      >
        {isClearing ? 'Clearing...' : '🔄 Clear Cache'}
      </Button>
    </div>
  );
} 