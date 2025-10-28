import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProfilePage from '../components/ProfilePage';
import { AuthService } from '../services/firebase';
import { apiService } from '../services/api';
import { User, LearningPlan } from '../types';

const ProfilePageRoute: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          const userProfile = await AuthService.getUserProfile(currentUser.uid);
          if (userProfile) {
            setUser(userProfile as User);
            // Load user's learning plans
            try {
              const response = await apiService.getLearningPlans();
              setPlans(response.data || []);
            } catch (error) {
              console.error('Error loading learning plans:', error);
            }
          } else {
            navigate('/auth');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
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
          plans={plans}
          onUpdateUser={handleUpdateProfile}
          onDeleteAccount={handleLogout}
          onBackToDashboard={handleBackToDashboard}
        />
      </main>
    </div>
  );
};

export default ProfilePageRoute;
