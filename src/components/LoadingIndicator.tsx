'use client';

import { motion } from 'framer-motion';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'blue' | 'green';
  message?: string;
}

export function LoadingIndicator({ 
  size = 'md', 
  color = 'purple',
  message = 'Loading...'
}: LoadingIndicatorProps) {
  
  const sizeMap = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-t-2 border-b-2',
    lg: 'h-16 w-16 border-4',
  };
  
  const colorMap = {
    purple: 'border-purple-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
  };
  
  const containerAnimation = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  
  const itemAnimation = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="flex flex-col justify-center items-center h-64"
      variants={containerAnimation}
      initial="hidden"
      animate="show"
    >
      <motion.div 
        className={`animate-spin rounded-full ${sizeMap[size]} ${colorMap[color]}`}
        variants={itemAnimation}
      />
      {message && (
        <motion.p 
          className="text-gray-500 mt-4 text-center font-medium"
          variants={itemAnimation}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
} 