'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface QuizTimerProps {
  timeLimitMinutes: number;
  onTimeUp: () => void;
  isActive: boolean;
  className?: string;
}

export function QuizTimer({ timeLimitMinutes, onTimeUp, isActive, className = '' }: QuizTimerProps) {
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(timeLimitMinutes * 60);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Reset timer when component becomes active or timeLimitMinutes changes
    setTimeLeftSeconds(timeLimitMinutes * 60);

    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        const newTime = prev - 1;
        
        // Set warning states
        const totalSeconds = timeLimitMinutes * 60;
        const warningThreshold = Math.max(300, totalSeconds * 0.2); // 5 minutes or 20% of total time
        const criticalThreshold = Math.max(60, totalSeconds * 0.1); // 1 minute or 10% of total time
        
        setIsWarning(newTime <= warningThreshold && newTime > criticalThreshold);
        setIsCritical(newTime <= criticalThreshold);

        // Time's up!
        if (newTime <= 0) {
          onTimeUp();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLimitMinutes, onTimeUp]);

  if (!isActive) {
    return null;
  }

  const getTimerColor = () => {
    if (isCritical) return 'text-red-600 bg-red-50 border-red-200';
    if (isWarning) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getIconColor = () => {
    if (isCritical) return 'text-red-500';
    if (isWarning) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-4 right-4 z-50 ${className}`}
    >
      <div className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg border-2 shadow-lg
        ${getTimerColor()}
        ${isCritical ? 'animate-pulse' : ''}
      `}>
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {isCritical ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="text-sm font-medium">
            {isCritical ? 'Time Almost Up!' : isWarning ? 'Time Running Low' : 'Time Remaining'}
          </div>
          <div className="text-lg font-bold font-mono">
            {formatTime(timeLeftSeconds)}
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
        <motion.div
          className={`h-1 rounded-full transition-colors duration-300 ${
            isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'
          }`}
          initial={{ width: '100%' }}
          animate={{ 
            width: `${(timeLeftSeconds / (timeLimitMinutes * 60)) * 100}%` 
          }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  );
}

export default QuizTimer; 