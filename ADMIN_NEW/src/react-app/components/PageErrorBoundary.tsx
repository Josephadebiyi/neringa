import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export default class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Page crashed:', error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack ?? null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">This page crashed</h2>
          <p className="text-sm text-red-600 font-mono bg-red-50 px-4 py-2 rounded-lg max-w-lg break-words mb-4">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <details className="text-left max-w-lg w-full mb-6">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Show stack trace</summary>
            <pre className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mt-2 overflow-x-auto whitespace-pre-wrap">
              {this.state.error?.stack}
              {this.state.componentStack}
            </pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null, componentStack: null })}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
