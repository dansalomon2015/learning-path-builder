import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import type { LearningObjective, LearningPath, LearningModule } from '../types';
import { Loader2, ArrowLeft, BookOpen, CheckCircle2, Clock, TrendingUp, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';

export default function ObjectivePathsListPage(): JSX.Element | null {
  const { objectiveId } = useParams<{ objectiveId: string }>();
  const navigate = useNavigate();
  const [objective, setObjective] = useState<LearningObjective | null>(null);
  const [loading, setLoading] = useState(true);

  const loadObjective = useCallback(async (): Promise<void> => {
    if (objectiveId == null || objectiveId === '') {
      toast.error('Objective ID is required');
      navigate('/dashboard');
      return;
    }

    try {
      setLoading(true);
      const res = await apiService.getObjective(objectiveId);
      const obj = res.data as unknown as LearningObjective;
      setObjective(obj);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg: string = error.response?.data?.message ?? 'Failed to load objective';
      toast.error(msg);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [objectiveId, navigate]);

  useEffect((): void => {
    void loadObjective();
  }, [loadObjective]);

  // Reload data when page becomes visible (user returns from module page)
  useEffect((): (() => void) => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible' && objectiveId != null) {
        void loadObjective();
      }
    };

    const handleFocus = (): void => {
      if (objectiveId != null) {
        void loadObjective();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return (): void => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [objectiveId, loadObjective]);

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyLabel = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      case 'easy':
        return 'Easy';
      case 'medium':
        return 'Medium';
      case 'hard':
        return 'Hard';
      default:
        return difficulty;
    }
  };

  /**
   * Calculate path progress based on modules (100% / number of modules)
   * Each module contributes its progress percentage weighted by module weight
   */
  const calculatePathProgress = (modules: LearningModule[]): number => {
    if (modules.length === 0) {
      return 0;
    }
    const moduleWeight = 100 / modules.length;
    const totalProgress = modules.reduce((sum: number, module: LearningModule): number => {
      const moduleProgress: number = typeof module.progress === 'number' ? module.progress : 0;
      return sum + (moduleProgress * moduleWeight) / 100;
    }, 0);
    return Math.round(totalProgress);
  };

  /**
   * Calculate objective global progress based on paths (100% / number of paths)
   * Each path contributes its progress percentage weighted by path weight
   */
  const calculateObjectiveProgress = (learningPaths: LearningPath[]): number => {
    if (learningPaths.length === 0) {
      return 0;
    }
    const pathWeight = 100 / learningPaths.length;
    const totalProgress = learningPaths.reduce(
      (sum: number, learningPath: LearningPath): number => {
        // Calculate path progress from its modules
        const modules = Array.isArray(learningPath.modules) ? learningPath.modules : [];
        const pathProgress = calculatePathProgress(modules);
        return sum + (pathProgress * pathWeight) / 100;
      },
      0
    );
    return Math.round(totalProgress);
  };

  // Calculate dynamic progress
  const dynamicProgress = useMemo((): number => {
    if (objective == null || objective.learningPaths == null) {
      return 0;
    }
    return calculateObjectiveProgress(objective.learningPaths);
  }, [objective]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading learning paths...</p>
        </div>
      </div>
    );
  }

  if (objective == null) {
    return null;
  }

  const paths: LearningPath[] = objective.learningPaths ?? [];
  const completedPaths = paths.filter((p): boolean => p.isCompleted === true).length;
  const totalPaths = paths.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={(): void => {
              navigate('/dashboard');
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">{objective.title}</h1>
          <p className="text-muted-foreground">{objective.description}</p>
        </div>

        {/* Stats */}
        {totalPaths > 0 && (
          <div className="mb-6 p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-foreground">{totalPaths}</div>
                <div className="text-sm text-muted-foreground">Available paths</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{completedPaths}</div>
                <div className="text-sm text-muted-foreground">Completed paths</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{dynamicProgress}%</span>
                </div>
                <Progress value={dynamicProgress} />
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {totalPaths} paths ({totalPaths > 0 ? Math.round(100 / totalPaths) : 0}%
                  per path)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Learning Paths List */}
        {totalPaths === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No learning paths available</h3>
              <p className="text-muted-foreground text-center mb-6">
                Learning paths will be generated after your first assessment.
              </p>
              <Button
                onClick={(): void => {
                  navigate(`/assessment/${objective.id}`);
                }}
              >
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.map((path: LearningPath): JSX.Element => {
              // Calculate path progress dynamically from modules
              const modules = Array.isArray(path.modules) ? path.modules : [];
              const progress: number = calculatePathProgress(modules);
              const isEnabled: boolean = path.isEnabled === true;
              const isCompleted: boolean = path.isCompleted === true;
              const modulesCount: number = modules.length;
              const completedModules: number = modules.filter(
                (m): boolean => m.isCompleted === true
              ).length;

              return (
                <Card
                  key={path.id}
                  className={`hover:shadow-lg transition-shadow ${
                    !isEnabled ? 'opacity-60' : 'cursor-pointer'
                  }`}
                >
                  <Link to={`/objectives/${objective.id}/paths/${path.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{path.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {path.description}
                          </CardDescription>
                        </div>
                        {!isEnabled && (
                          <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                        )}
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className={getDifficultyColor(path.difficulty)}>
                          {getDifficultyLabel(path.difficulty)}
                        </Badge>
                        {path.estimatedDuration > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {path.estimatedDuration}h
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Progress */}
                      {progress > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} />
                        </div>
                      )}

                      {/* Modules info */}
                      {modulesCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <BookOpen className="h-4 w-4" />
                          <span>
                            {completedModules}/{modulesCount} modules completed
                          </span>
                        </div>
                      )}

                      {/* Skills */}
                      {Array.isArray(path.skills) && path.skills.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>Skills</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {path.skills.slice(0, 3).map(
                              (skill: string, index: number): JSX.Element => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              )
                            )}
                            {path.skills.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{path.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
