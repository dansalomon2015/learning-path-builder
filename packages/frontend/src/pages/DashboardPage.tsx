import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchLearningPlans,
  createLearningPlan,
  deleteLearningPlan,
  updateLearningPlan,
} from '../store/slices/learningPlansSlice';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import ProfileModal from '../components/ProfileModal';
import { User, LearningPlan } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, logout } = useAuth();
  const { plans, isLoading } = useAppSelector(state => state.learningPlans);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load learning plans when component mounts
  useEffect(() => {
    if (user) {
      dispatch(fetchLearningPlans());
    }
  }, [dispatch, user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpdateProfile = (updatedUser: User) => {
    // Profile updates are handled by Redux auth slice
    console.log('Profile updated:', updatedUser);
  };

  const handleStartStudy = (plan: LearningPlan, mode: 'flashcards' | 'quiz') => {
    navigate(`/study/${plan.id}`, { state: { plan, mode } });
  };

  const handleCreatePlan = async (planData: {
    title: string;
    description: string;
    topic: string;
    skillLevel: string;
    mode: string;
    cardCount?: number;
    generateFromDocument?: boolean;
  }) => {
    try {
      await dispatch(
        createLearningPlan({
          title: planData.title,
          description: planData.description,
          topic: planData.topic,
          skillLevel: planData.skillLevel,
          mode: planData.mode,
        })
      ).unwrap();
    } catch (error) {
      console.error('Error creating learning plan:', error);
      throw error; // Re-throw to show error in modal
    }
  };

  const handleUpdatePlan = async (planId: string, data: Partial<LearningPlan>) => {
    try {
      await dispatch(updateLearningPlan({ planId, planData: data })).unwrap();
    } catch (error) {
      console.error('Error updating learning plan:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await dispatch(deleteLearningPlan(planId)).unwrap();
    } catch (error) {
      console.error('Error deleting learning plan:', error);
    }
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  if (isLoading) {
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
      <Header user={user} onLogout={handleLogout} onViewProfile={handleViewProfile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard
          plans={plans}
          onCreatePlan={handleCreatePlan}
          onStartStudy={handleStartStudy}
          onUpdatePlan={handleUpdatePlan}
          onDeletePlan={handleDeletePlan}
        />
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default DashboardPage;
