import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import ProfileModal from '../components/ProfileModal';
import type { User } from '../types';

const DashboardPage: React.FC = (): JSX.Element | null => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/');
    } catch (error: unknown) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateProfile = (updatedUser: User): void => {
    // Profile updates are handled by Redux auth slice
    // eslint-disable-next-line no-console
    console.log('Profile updated:', updatedUser);
  };

  const handleViewProfile = (): void => {
    navigate('/profile');
  };

  if (user == null) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} onLogout={handleLogout} onViewProfile={handleViewProfile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </main>

      {/* Profile Modal */}
      {showProfileModal === true && (
        <ProfileModal
          user={user}
          isOpen={showProfileModal}
          onClose={(): void => {
            setShowProfileModal(false);
          }}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default DashboardPage;
