import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ProfilePage from '../components/ProfilePage';
import { User } from '../types';

const ProfilePageRoute: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authUser) {
      // authUser is already a User type from Redux store
      // Just ensure all required fields are present
      const userProfile: User = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.name || authUser.email?.split('@')[0] || 'User',
        learningObjectives: authUser.learningObjectives || [],
        preferences: authUser.preferences || {
          studyMode: 'mixed',
          difficultyAdjustment: 'automatic',
          sessionLength: 30,
          notifications: true,
          language: 'en',
        },
        createdAt: authUser.createdAt || new Date().toISOString(),
        updatedAt: authUser.updatedAt || new Date().toISOString(),
      };
      setUser(userProfile);
    } else {
      navigate('/auth');
    }
    setLoading(false);
  }, [authUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
    // TODO: Call API to update user profile
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        user={user}
        onLogout={handleLogout}
        onViewProfile={() => {}} // Already on profile page
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfilePage
          user={user}
          onUpdateUser={handleUpdateProfile}
          onDeleteAccount={handleLogout}
          onBackToDashboard={handleBackToDashboard}
        />
      </main>
    </div>
  );
};

export default ProfilePageRoute;
