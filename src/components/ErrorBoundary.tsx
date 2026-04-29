import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WarningCircle } from '@phosphor-icons/react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg)] text-[var(--text-main)] p-6">
          <div className="bg-[var(--surface)] border border-red-200 rounded-xl p-8 max-w-md w-full text-center shadow-lg">
            <WarningCircle size={48} className="text-red-500 mx-auto mb-4" weight="duotone" />
            <h1 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h1>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              An unexpected error occurred in the application. Please try refreshing the page.
            </p>
            {this.state.error && (
              <div className="bg-red-50 p-4 rounded-lg text-left overflow-auto max-h-40 mb-6 border border-red-100">
                <p className="text-xs font-mono text-red-800 break-words">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors w-full"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
