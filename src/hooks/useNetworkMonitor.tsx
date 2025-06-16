'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NetworkState {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  lastChecked: Date | null;
}

interface NetworkContextType extends NetworkState {
  retryCount: number;
  retryConnection: () => Promise<boolean>;
  hasConnectionIssues: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null,
    lastChecked: null
  });

  const [retryCount, setRetryCount] = useState(0);

  // Check connection speed
  const checkConnectionSpeed = async (): Promise<boolean> => {
    try {
      const startTime = Date.now();
      // Try to fetch a small image from the app's domain
      await fetch('/favicon.ico?' + Math.random(), { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Consider connection slow if it takes more than 3 seconds for a tiny request
      return duration > 3000;
    } catch (error) {
      // Only log if there's an actual error, not just slow connection
      return true; // Assume slow if we can't check
    }
  };

  // Test actual connectivity with retry mechanism
  const testConnectivity = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeout);
      return response.ok;
    } catch (error) {
      // Only log connectivity failures after multiple retries
      if (retryCount > 1) {
        console.warn('Connectivity test failed after retries:', error);
      }
      return false;
    }
  };

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      // Silent network detection - no console logs
      const isSlowConnection = await checkConnectionSpeed();
      setNetworkState(prev => ({
        ...prev,
        isOnline: true,
        isSlowConnection,
        lastChecked: new Date()
      }));
      setRetryCount(0);
    };

    const handleOffline = () => {
      // Only log when actually going offline (more important)
      console.warn('Browser went offline');
      setNetworkState(prev => ({
        ...prev,
        isOnline: false,
        lastChecked: new Date()
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    handleOnline();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic connectivity monitoring
  useEffect(() => {
    const interval = setInterval(async () => {
      if (navigator.onLine) {
        const isConnected = await testConnectivity();
        if (!isConnected) {
          setRetryCount(prev => prev + 1);
        } else {
          setRetryCount(0);
        }
        
        const isSlowConnection = await checkConnectionSpeed();
        
        setNetworkState(prev => ({
          ...prev,
          isOnline: isConnected,
          isSlowConnection,
          lastChecked: new Date()
        }));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Get connection type if available
  useEffect(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const updateConnectionType = () => {
        setNetworkState(prev => ({
          ...prev,
          connectionType: connection.effectiveType || connection.type || null
        }));
      };

      connection.addEventListener('change', updateConnectionType);
      updateConnectionType(); // Initial check

      return () => {
        connection.removeEventListener('change', updateConnectionType);
      };
    }
  }, []);

  const retryConnection = async (): Promise<boolean> => {
    const isConnected = await testConnectivity();
    setNetworkState(prev => ({
      ...prev,
      isOnline: isConnected,
      lastChecked: new Date()
    }));
    
    if (isConnected) {
      setRetryCount(0);
    }
    
    return isConnected;
  };

  const contextValue: NetworkContextType = {
    ...networkState,
    retryCount,
    retryConnection,
    hasConnectionIssues: !networkState.isOnline || retryCount > 2
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
}

// Hook to use network state
export function useNetworkMonitor(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetworkMonitor must be used within a NetworkProvider');
  }
  return context;
} 