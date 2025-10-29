import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import StudySession from '../components/StudySession';
import { AuthService } from '../services/firebase';
import { User, LearningPlan } from '../types';

const StudyPage: React.FC = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [studyMode, setStudyMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
          navigate('/');
          return;
        }

        const userProfile = await AuthService.getUserProfile(currentUser.uid);
        if (!userProfile) {
          navigate('/auth');
          return;
        }

        setUser(userProfile as User);

        // Get plan data from location state or fetch by ID
        if (location.state?.plan) {
          setPlan(location.state.plan);
          setStudyMode(location.state.mode || 'flashcards');
        } else if (planId) {
          // TODO: Fetch plan by ID from API
          console.log('Need to fetch plan by ID:', planId);
        }
      } catch (error) {
        console.error('Error loading study data:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, planId, location.state]);

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleStudyComplete = () => {
    // Session completion is handled by StudySession component
    // We can add additional logic here if needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !plan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Plan not found</h2>
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header user={user} onLogout={handleLogout} onViewProfile={() => navigate('/profile')} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudySession
          plan={plan}
          mode={studyMode}
          onComplete={handleStudyComplete}
          onBack={handleBackToDashboard}
        />
      </main>
    </div>
  );
};

export default StudyPage;
