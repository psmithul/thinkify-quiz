'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  autoRetry?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting service (e.g., Sentry, LogRocket)
      console.log('Error would be reported to monitoring service');
    }
    
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          showDetails={this.props.showDetails ?? process.env.NODE_ENV === 'development'}
          autoRetry={this.props.autoRetry ?? true}
        />
      );
    }

    return this.props.children;
  }
} 