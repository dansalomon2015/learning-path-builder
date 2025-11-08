import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Target, TrendingUp, LogOut, Loader2, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { ObjectiveCard } from '../components/ObjectiveCard';
import { StreakCard } from '../components/StreakCard';
import CreateObjectiveModal from '../components/CreateObjectiveModal';
import { apiService } from '../services/api';
import type { LearningObjective } from '../types';
import { toast } from 'react-hot-toast';

// eslint-disable-next-line max-lines-per-function
export default function DashboardPage(): JSX.Element | null {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState<string>('');
  const hasLoadedRef = useRef(false);

  useEffect((): void => {
    const fetchObjectives = async (): Promise<void> => {
      try {
        const res = await apiService.getObjectives();
        const objectivesData = res.data as unknown as LearningObjective[];
        setObjectives(Array.isArray(objectivesData) ? objectivesData : []);
      } catch (e: unknown) {
        console.error('Failed to load objectives', e);
        toast.error('Failed to load objectives');
      } finally {
        setLoading(false);
      }
    };

    if (user != null && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchObjectives().catch((error: unknown): void => {
        console.error('Error fetching objectives:', error);
      });
    }
  }, [user]);

  const handleSignOut = async (): Promise<void> => {
    try {
      await logout();
      navigate('/');
    } catch (error: unknown) {
      console.error('Logout error:', error);
    }
  };

  const handleCreateObjective = async (objectiveData: {
    title: string;
    description: string;
    category: string;
    targetRole: string;
    targetTimeline: number;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }): Promise<boolean> => {
    try {
      const response = await apiService.createObjective({
        title: objectiveData.title,
        description: objectiveData.description,
        category: objectiveData.category,
        targetRole: objectiveData.targetRole,
        targetTimeline: objectiveData.targetTimeline,
        currentLevel: objectiveData.currentLevel,
        targetLevel: objectiveData.targetLevel,
      });

      if (response.success === true) {
        toast.success('Objective created successfully');
        // Refresh objectives list
        const res = await apiService.getObjectives();
        const objectivesData = res.data as unknown as LearningObjective[];
        setObjectives(Array.isArray(objectivesData) ? objectivesData : []);
        return true;
      }
      return false;
    } catch (error: unknown) {
      console.error('Error creating objective:', error);
      toast.error('Failed to create objective');
      return false;
    }
  };

  const handleDeleteObjective = (objectiveId: string): void => {
    const obj = objectives.find((o) => o.id === objectiveId);
    setConfirmDeleteId(objectiveId);
    setConfirmDeleteTitle(obj?.title ?? 'this objective');
  };

  const closeDeleteConfirm = (): void => {
    setConfirmDeleteId(null);
    setConfirmDeleteTitle('');
  };

  const confirmDeleteObjective = async (): Promise<void> => {
    if (confirmDeleteId == null || confirmDeleteId === '') {
      return;
    }

    try {
      const res = await apiService.deleteObjective(confirmDeleteId);
      if (res.success === true) {
        setObjectives((prev) => prev.filter((o) => o.id !== confirmDeleteId));
        toast.success('Objective deleted');
      } else {
        const errorMessage =
          res.error?.message != null && res.error.message !== ''
            ? res.error.message
            : 'Failed to delete objective';
        toast.error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete objective';
      toast.error(errorMessage);
    } finally {
      closeDeleteConfirm();
    }
  };

  if (user == null) {
    return null; // Will redirect
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="lg" />
            <span className="text-2xl font-bold">FlashLearn AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={(): void => navigate('/profile')}>
              <User className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Manage your learning objectives and track your progress
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 md:grid-rows-2 gap-6 mb-8">
          <div className="md:row-span-2">
            <StreakCard userId={user.id} />
          </div>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Objectives</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objectives.length}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Modules</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {objectives.reduce((sum, obj): number => {
                  return (
                    sum +
                    obj.learningPaths.reduce((pathSum, path): number => {
                      return (
                        pathSum + path.modules.filter((m): boolean => m.isCompleted === true).length
                      );
                    }, 0)
                  );
                }, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all paths</p>
            </CardContent>
          </Card>
        </div>

        {/* Objectives Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">My Objectives</h2>
            <Button onClick={(): void => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Objective
            </Button>
          </div>

          {objectives.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Target className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No objectives yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Create your first learning objective to start your journey with FlashLearn AI
                </p>
                <Button onClick={(): void => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create My First Objective
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {objectives.map(
                (objective): JSX.Element => (
                  <ObjectiveCard
                    key={objective.id}
                    objective={objective}
                    onDelete={handleDeleteObjective}
                  />
                )
              )}
            </div>
          )}
        </div>
      </main>

      <CreateObjectiveModal
        isOpen={showCreateDialog}
        onClose={(): void => setShowCreateDialog(false)}
        onCreate={handleCreateObjective}
      />

      {/* Delete Confirmation Modal */}
      {confirmDeleteId != null && confirmDeleteId !== '' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Objective</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{confirmDeleteTitle}</span>? This action will also delete all associated learning paths.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={closeDeleteConfirm}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteObjective}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
