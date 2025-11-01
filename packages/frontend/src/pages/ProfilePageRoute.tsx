import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ProfilePage from '../components/ProfilePage';
import type { User } from '../types';

const ProfilePageRoute: React.FC = (): JSX.Element | null => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const authUser: User | null = authContext.user;
  const logout: () => Promise<void> = authContext.logout;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect((): void => {
    if (authUser != null) {
      // authUser is already a User type from Redux store
      // All required fields are guaranteed by the User interface
      const email: string = authUser.email;
      const name: string = authUser.name !== '' ? authUser.name : email.split('@')[0] ?? 'User';
      const learningObjectives: string[] = authUser.learningObjectives;
      const preferences = authUser.preferences;
      const createdAt: string = authUser.createdAt;
      const updatedAt: string = authUser.updatedAt;

      const userProfile: User = {
        id: authUser.id,
        email,
        name,
        learningObjectives,
        preferences,
        createdAt,
        updatedAt,
      };
      setUser(userProfile);
    } else {
      navigate('/auth');
    }
    setLoading(false);
  }, [authUser, navigate]);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/');
    } catch (error: unknown) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateProfile = (updatedUser: User): void => {
    setUser(updatedUser);
    // TODO: Call API to update user profile
  };

  const handleBackToDashboard = (): void => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (user == null) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        user={user}
        onLogout={handleLogout}
        onViewProfile={(): void => {
          // Already on profile page
        }}
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
