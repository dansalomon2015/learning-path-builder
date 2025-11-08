import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  User,
  Mail,
  Calendar,
  Target,
  BookOpen,
  Flame,
  Award,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from '../components/Logo';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

// eslint-disable-next-line max-lines-per-function
export default function ProfilePageRoute(): JSX.Element | null {
  const { user: authUser, logout: _logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState({
    totalObjectives: 0,
    completedModules: 0,
    totalFlashcards: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalStudyDays: 0,
    averageScore: 0,
  });

  useEffect((): void => {
    const loadProfile = async (): Promise<void> => {
      if (authUser == null) {
        navigate('/auth');
        return;
      }

      const emailParts = authUser.email.split('@');
      const defaultName = emailParts.length > 0 ? emailParts[0] : 'User';
      setName(authUser.name !== '' ? authUser.name : defaultName);
      setEmail(authUser.email);

      // Load objectives for stats
      try {
        const res = await apiService.getObjectives();
        const objectivesData = res.data as unknown;
        if (!Array.isArray(objectivesData)) {
          return;
        }
        const objectives = objectivesData as Array<Record<string, unknown>>;
        const calculateCompletedModules = (objs: Array<Record<string, unknown>>): number => {
          let completed = 0;
          for (const obj of objs) {
            const paths = obj.learningPaths;
            if (!Array.isArray(paths)) {
              continue;
            }
            for (const path of paths as Array<Record<string, unknown>>) {
              const modules = path.modules;
              if (!Array.isArray(modules)) {
                continue;
              }
              for (const module of modules as Array<Record<string, unknown>>) {
                if (module.isCompleted === true) {
                  completed += 1;
                }
              }
            }
          }
          return completed;
        };
        setStats((prev: typeof stats): typeof stats => ({
          ...prev,
          totalObjectives: objectives.length,
          completedModules: calculateCompletedModules(objectives),
        }));
      } catch (error: unknown) {
        console.error('Failed to load objectives:', error);
      }

      setLoading(false);
    };

    loadProfile().catch((error: unknown): void => {
      console.error('Error loading profile:', error);
      setLoading(false);
    });
  }, [authUser, navigate]);

  const handleSaveProfile = (): void => {
    // TODO: Save to backend via API when updateUser endpoint is available
    // For now, just update local state
    toast.success('Profile updated');
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authUser == null) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={(): void => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Logo size="lg" />
              <span className="text-2xl font-bold">FlashLearn AI</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">My Profile</h1>
          <p className="text-muted-foreground text-lg">
            Manage your information and view your statistics
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4 pb-4 border-b">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{name}</h3>
                    <p className="text-sm text-muted-foreground">{email}</p>
                  </div>
                </div>

                {editing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e): void => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e): void => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} className="flex-1">
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={(): void => setEditing(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Member since{' '}
                        {new Date(authUser.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={(): void => setEditing(true)}
                      className="w-full mt-4"
                    >
                      Edit Profile
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.currentStreak > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Flame className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fire Streak</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.currentStreak} consecutive days
                      </p>
                    </div>
                  </div>
                )}
                {stats.totalObjectives > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Goal Achieved</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalObjectives} objectives created
                      </p>
                    </div>
                  </div>
                )}
                {stats.totalFlashcards > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Dedicated Student</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalFlashcards} flashcards studied
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Statistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Stats */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalObjectives}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Learning paths
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Completed Modules</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.completedModules}</div>
                  <p className="text-xs text-muted-foreground mt-1">Successfully</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Flashcards Studied</CardTitle>
                  <Logo size="sm" className="opacity-60" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalFlashcards}</div>
                  <p className="text-xs text-muted-foreground mt-1">Cards memorized</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.averageScore}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Across all quizzes</p>
                </CardContent>
              </Card>
            </div>

            {/* Streak Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-primary" />
                  Streak Statistics
                </CardTitle>
                <CardDescription>Your daily learning progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-3xl font-bold text-primary">{stats.currentStreak}</p>
                    <p className="text-xs text-muted-foreground">consecutive days</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Best Streak</p>
                    <p className="text-3xl font-bold text-secondary">{stats.longestStreak}</p>
                    <p className="text-xs text-muted-foreground">maximum days</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Study</p>
                    <p className="text-3xl font-bold text-accent">{stats.totalStudyDays}</p>
                    <p className="text-xs text-muted-foreground">days total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
