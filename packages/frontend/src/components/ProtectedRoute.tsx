import type React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }): JSX.Element => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading === true) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (isAuthenticated !== true) {
    // Redirect to auth page with return url
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <div>{children}</div>;
};

export default ProtectedRoute;
