# Error Handling & Loading Timeout System

This document explains the comprehensive error handling and loading timeout system implemented in the Thinkify Quiz Platform.

## Overview

The app now has robust error handling and loading timeout mechanisms to prevent users from getting stuck on any page and provide clear feedback when things go wrong.

## Key Features

### 1. Loading Timeouts
- **10-second timeout** for most operations
- **15-second timeout** for authentication
- **Automatic redirect** to homepage when timeouts occur
- **Visual countdown** in the last 5 seconds

### 2. Network Monitoring
- **Real-time connection status** detection
- **Slow connection warnings**
- **Automatic retry mechanisms**
- **Connection speed testing**

### 3. Error Classification
Errors are automatically classified and handled appropriately:
- **Network errors**: Connection issues, fetch failures
- **Timeout errors**: Request timeouts, slow responses
- **Database errors**: Supabase connection issues
- **Authentication errors**: Login/logout problems
- **404 errors**: Page not found
- **Server errors**: 500, internal server errors

### 4. User-Friendly Error Messages
Each error type has specific, actionable messages that help users understand what went wrong and what they can do about it.

## Components

### `useLoadingTimeout` Hook
```tsx
const { hasTimedOut, timeRemaining, resetTimeout } = useLoadingTimeout(isLoading, {
  timeout: 10000, // 10 seconds
  redirectPath: '/', // Where to redirect on timeout
  onTimeout: () => console.log('Timeout reached'),
  enabled: true
});
```

### `useNetworkMonitor` Hook
```tsx
const { 
  isOnline, 
  isSlowConnection, 
  hasConnectionIssues, 
  retryConnection 
} = useNetworkMonitor();
```

### `LoadingSpinner` Component
```tsx
<LoadingSpinner
  isLoading={true}
  message="Loading data..."
  showTimeout={true}
  timeoutDuration={10000}
  size="lg"
/>
```

### `ErrorFallback` Component
```tsx
<ErrorFallback
  error={error}
  resetError={() => setError(null)}
  showDetails={true}
  autoRetry={true}
  redirectDelay={15000}
/>
```

### `PageWrapper` Component
```tsx
<PageWrapper
  isLoading={loading}
  error={error}
  onRetry={retry}
  loadingMessage="Loading page..."
  title="Page Title"
>
  {/* Page content */}
</PageWrapper>
```

## Error Boundaries

### Global Error Boundary
Located in `src/app/layout.tsx`, catches all unhandled React errors and displays the ErrorFallback component.

### Page-Level Error Handling
Each page can use the `PageWrapper` component for consistent error handling:

```tsx
export default function MyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  return (
    <PageWrapper
      isLoading={loading}
      error={error}
      onRetry={() => {
        setError(null);
        // Retry logic
      }}
    >
      {/* Page content */}
    </PageWrapper>
  );
}
```

## Authentication Error Handling

The `AuthProvider` now includes:
- **15-second timeout** for auth operations
- **Automatic retry** with exponential backoff
- **Fallback user profiles** when database fails
- **Network-aware retries**

## API Error Handling

Use the `withAsyncHandling` utility for API calls:

```tsx
import { withAsyncHandling } from '@/utils/errorHandling';

const fetchData = async () => {
  const result = await withAsyncHandling(
    () => fetch('/api/data').then(r => r.json()),
    {
      timeout: 5000,
      retries: 3,
      onError: (error) => console.log('API error:', error),
      onRetry: (attempt) => console.log(`Retry attempt ${attempt}`)
    }
  );

  if (result.error) {
    setError(result.error);
  } else {
    setData(result.data);
  }
};
```

## Network Error Handling

The app automatically detects and handles:
- **Offline status**: Shows offline banner
- **Slow connections**: Displays slow connection warning
- **Connection issues**: Provides retry options
- **API connectivity**: Tests connection to app endpoints

## Loading States

### Global Loading
- **Route transitions**: Automatic loading page
- **Authentication**: Enhanced loading with timeout
- **Initial app load**: Prevents hanging on startup

### Component Loading
Use the `LoadingSpinner` component for consistent loading states with automatic timeout handling.

## Error Recovery

### Automatic Recovery
- **Network reconnection**: Auto-retry when connection restored
- **Authentication errors**: Automatic session refresh
- **Temporary failures**: Exponential backoff retry

### Manual Recovery
Users always have options to:
- **Try Again**: Retry the failed operation
- **Go Home**: Navigate to homepage
- **Reload Page**: Full page refresh
- **Go Back**: Return to previous page

## Configuration

### Timeout Settings
```tsx
// Component-level timeouts
const LOADING_TIMEOUT = 10000; // 10 seconds
const AUTH_TIMEOUT = 15000; // 15 seconds
const API_TIMEOUT = 5000; // 5 seconds

// Auto-redirect delays
const ERROR_REDIRECT_DELAY = 15000; // 15 seconds
const GLOBAL_ERROR_REDIRECT_DELAY = 30000; // 30 seconds
```

### Retry Settings
```tsx
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds
  backoffMultiplier: 2 // Exponential backoff
};
```

## Best Practices

### 1. Always Provide Fallbacks
Every loading state should have a timeout and fallback:

```tsx
// ✅ Good
<LoadingSpinner 
  isLoading={loading} 
  showTimeout={true} 
  timeoutDuration={10000} 
/>

// ❌ Bad
{loading && <div>Loading...</div>}
```

### 2. Use Meaningful Error Messages
Provide context about what failed and what users can do:

```tsx
// ✅ Good
setError(new Error('Failed to load quiz questions. Please check your connection and try again.'));

// ❌ Bad
setError(new Error('Error'));
```

### 3. Implement Retry Logic
Always provide users with recovery options:

```tsx
// ✅ Good
<ErrorFallback 
  error={error} 
  resetError={handleRetry}
  autoRetry={true} 
/>

// ❌ Bad
{error && <div>Something went wrong</div>}
```

### 4. Test Error States
Regularly test error conditions:
- Disconnect network
- Slow down connection
- Mock API failures
- Test timeout scenarios

## Development Testing

### Simulating Errors
```tsx
// Simulate network error
throw new Error('Network request failed');

// Simulate timeout
await new Promise(resolve => setTimeout(resolve, 20000));

// Simulate database error
throw new Error('Database connection failed');
```

### Testing Timeouts
Set shorter timeouts in development:
```tsx
const isDevelopment = process.env.NODE_ENV === 'development';
const timeout = isDevelopment ? 2000 : 10000; // 2s in dev, 10s in prod
```

## Monitoring

### Error Logging
All errors are logged with context:
- Timestamp
- User agent
- Current URL
- Stack trace
- Additional context

### Production Monitoring
In production, errors should be sent to monitoring services:
- Sentry for error tracking
- LogRocket for session replay
- Custom analytics for user experience

## Troubleshooting

### Common Issues

1. **Infinite Loading**: Check for missing timeout configuration
2. **No Error Boundaries**: Ensure ErrorBoundary wraps components
3. **Poor Error Messages**: Use specific, actionable error text
4. **No Recovery Options**: Always provide retry/navigation options

### Debugging

Enable detailed error logging in development:
```tsx
const DEBUG_ERRORS = process.env.NODE_ENV === 'development';
if (DEBUG_ERRORS) {
  console.log('Detailed error info:', error);
}
```

## Migration Guide

### Existing Components
Update existing components to use the new system:

```tsx
// Before
function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  return loading ? <div>Loading...</div> : <div>Content</div>;
}

// After
function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  return (
    <PageWrapper 
      isLoading={loading} 
      error={error}
      onRetry={() => setError(null)}
    >
      <div>Content</div>
    </PageWrapper>
  );
}
```

### API Calls
Wrap API calls with error handling:

```tsx
// Before
const data = await fetch('/api/data').then(r => r.json());

// After
const result = await withAsyncHandling(() => 
  fetch('/api/data').then(r => r.json())
);

if (result.error) {
  setError(result.error);
} else {
  setData(result.data);
}
```

This comprehensive error handling system ensures users never get stuck and always have clear paths to recovery when things go wrong. 