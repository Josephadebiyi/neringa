import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show a clean loader while the global auth state is being resolved
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <div className="text-gray-600 font-medium">Authenticating Terminal Session...</div>
        </div>
      </div>
    );
  }

  // If after loading there's no user, back to login
  if (!user) {
    console.warn("Unauthorized access attempt - Redirecting to login");
    return <Navigate to="/" replace />;
  }

  // All good, show the protected screen
  return <>{children}</>;
}
