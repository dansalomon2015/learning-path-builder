import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import StudySession from '../components/StudySession';
import type { User, LearningPlan } from '../types';

const StudyPage: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const params = useParams<{ planId: string }>();
  const planId: string | undefined = params.planId;
  const location = useLocation();
  const authContext = useAuth();
  const user: User | null = authContext.user;
  const isAuthenticated: boolean = authContext.isAuthenticated;
  const logout: () => Promise<void> = authContext.logout;
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [studyMode, setStudyMode] = useState<'flashcards' | 'quiz'>('flashcards');
  const [loading, setLoading] = useState(true);

  useEffect((): (() => void) | undefined => {
    const loadData = (): void => {
      try {
        // Check authentication
        if (!isAuthenticated || user == null) {
          navigate('/auth');
          setLoading(false);
          return;
        }

        // Get plan data from location state or fetch by ID
        const locationState = location.state as {
          plan?: LearningPlan;
          mode?: 'flashcards' | 'quiz';
        } | null;
        if (locationState?.plan != null) {
          setPlan(locationState.plan);
          setStudyMode(locationState.mode ?? 'flashcards');
        } else if (planId != null && planId !== '') {
          // TODO: Fetch plan by ID from API
          // eslint-disable-next-line no-console
          console.log('Need to fetch plan by ID:', planId);
        }
        setLoading(false);
      } catch (error: unknown) {
        console.error('Error loading study data:', error);
        navigate('/dashboard');
        setLoading(false);
      }
    };

    loadData();
    return undefined;
  }, [navigate, planId, location.state, isAuthenticated, user]);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/');
    } catch (error: unknown) {
      console.error('Logout error:', error);
    }
  };

  const handleBackToDashboard = (): void => {
    navigate('/dashboard');
  };

  const handleStudyComplete = (): void => {
    // Session completion is handled by StudySession component
    // We can add additional logic here if needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (user == null || plan == null) {
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
      <Header
        user={user}
        onLogout={handleLogout}
        onViewProfile={(): void => {
          navigate('/profile');
        }}
      />

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
