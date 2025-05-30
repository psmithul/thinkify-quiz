// Performance utilities for the quiz application

/**
 * Clear browser cache and reload the page
 * Useful for development when components are updated
 */
export function clearCacheAndReload(): void {
  if (typeof window !== 'undefined') {
    // Clear local storage
    localStorage.clear();
    
    // Clear session storage
    sessionStorage.clear();
    
    // Force reload with cache bypass
    window.location.reload();
  }
}

/**
 * Optimize image loading with lazy loading
 */
export function optimizeImageLoading(): void {
  if (typeof window !== 'undefined') {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src!;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Memoize expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Log performance metrics (only in development)
 */
export function logPerformance(label: string, startTime: number): void {
  if (isDevelopment() && typeof window !== 'undefined') {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`⚡ Performance [${label}]: ${duration.toFixed(2)}ms`);
  }
} 