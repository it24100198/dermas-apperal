import { Component } from 'react';
import { useNavigate } from 'react-router-dom';

export class ErrorBoundaryClass extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[280px] p-6 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-amber-800 font-semibold">Something went wrong</p>
          <p className="text-amber-700 text-sm mt-1">{this.state.error?.message || 'Unknown error'}</p>
          <this.props.BackLink />
        </div>
      );
    }
    return this.props.children;
  }
}

function BackLink() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/jobs')} className="mt-4 text-blue-600 hover:underline flex items-center gap-1">
      <i className="bi bi-arrow-left" /> Back to All Jobs
    </button>
  );
}

export default function ErrorBoundary({ children }) {
  return (
    <ErrorBoundaryClass BackLink={BackLink}>
      {children}
    </ErrorBoundaryClass>
  );
}
