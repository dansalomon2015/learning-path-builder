import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleAuthSuccess = () => {
    navigate('/dashboard');
  };

  const handleSwitchMode = () => {
    setAuthMode(prev => (prev === 'login' ? 'register' : 'login'));
  };

  // If already authenticated, redirect to dashboard (including on refresh)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <AuthForm mode={authMode} onSuccess={handleAuthSuccess} onSwitchMode={handleSwitchMode} />
      </div>
    </div>
  );
};

export default AuthPage;
