'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-500 mb-4">發生錯誤</h1>
            <p className="text-gray-400 mb-4">應用程式遇到一個錯誤，請重新載入頁面。</p>
            {this.state.error && (
              <p className="text-gray-500 text-sm mb-4">{this.state.error.message}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-lg text-white"
              style={{ backgroundColor: '#E42313' }}
            >
              重新載入
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
