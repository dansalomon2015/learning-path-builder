import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, Target, TrendingUp, Trophy, BookOpen, BarChart3, Trash2 } from 'lucide-react';
import { ObjectiveStatus, SkillLevel } from '@/types';
import type { LearningObjective } from '@/types';

interface ObjectiveCardProps {
  objective: LearningObjective;
  onDelete?: (objectiveId: string) => void;
}

// eslint-disable-next-line max-lines-per-function, complexity
export function ObjectiveCard({ objective, onDelete }: ObjectiveCardProps): JSX.Element {
  // Calculate statistics (needed for badge logic)
  const completedMilestones = objective.milestones.filter(
    (m): boolean => m.isCompleted === true
  ).length;
  const totalMilestones = objective.milestones.length;
  const completedPaths = objective.learningPaths.filter(
    (p): boolean => p.isCompleted === true
  ).length;
  const totalPaths = objective.learningPaths.length;
  const hasPaths = totalPaths > 0;

  const getStatusBadge = (): JSX.Element => {
    // Use the same condition as the button - assessment is needed if:
    // - status is PLANNING
    // - no assessment results
    // - no learning paths yet
    const needsAssessment =
      objective.status === ObjectiveStatus.PLANNING &&
      (objective.assessmentResults == null || objective.assessmentResults.length === 0) &&
      !hasPaths;

    switch (objective.status) {
      case ObjectiveStatus.PLANNING:
        // Only show "En attente d'évaluation" if assessment is truly needed (same condition as button)
        if (needsAssessment) {
          return <Badge variant="secondary">Awaiting Assessment</Badge>;
        }
        // If assessment is done or paths exist but status is still PLANNING, show a different badge
        return <Badge variant="secondary">In Preparation</Badge>;
      case ObjectiveStatus.IN_PROGRESS:
        return <Badge className="bg-primary">In Progress</Badge>;
      case ObjectiveStatus.COMPLETED:
        return <Badge className="bg-green-500">Completed</Badge>;
      case ObjectiveStatus.PAUSED:
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge variant="outline">{objective.status}</Badge>;
    }
  };

  const getLevelLabel = (level: SkillLevel): string => {
    const labels: Record<SkillLevel, string> = {
      [SkillLevel.BEGINNER]: 'Beginner',
      [SkillLevel.INTERMEDIATE]: 'Intermediate',
      [SkillLevel.ADVANCED]: 'Advanced',
      [SkillLevel.EXPERT]: 'Expert',
    };
    return labels[level];
  };

  const avgPathProgress =
    objective.learningPaths.length > 0
      ? Math.round(
          objective.learningPaths.reduce((sum: number, p): number => {
            const progressValue: number = typeof p.progress === 'number' ? p.progress : 0;
            return sum + progressValue;
          }, 0) / objective.learningPaths.length
        )
      : 0;

  // Get last assessment result if available
  const lastAssessment =
    objective.assessmentResults != null && objective.assessmentResults.length > 0
      ? objective.assessmentResults[objective.assessmentResults.length - 1]
      : null;

  // Determine what action button to show (using same condition as badge)
  const needsAssessment =
    objective.status === ObjectiveStatus.PLANNING &&
    (objective.assessmentResults == null || objective.assessmentResults.length === 0) &&
    !hasPaths;


  return (
    <Card className="border-2 hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Target className="h-5 w-5 text-primary" />
          <div className="flex items-center gap-3">
          {getStatusBadge()}
            {onDelete != null && (
              <button
                onClick={(e): void => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(objective.id);
                }}
                className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                title="Delete objective"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <CardTitle className="text-xl">{objective.title}</CardTitle>
        <CardDescription>{objective.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category and Target Role */}
        <div className="flex flex-wrap gap-3 text-sm">
          {objective.category !== '' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{objective.category}</span>
            </div>
          )}
          {objective.targetRole !== '' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>{objective.targetRole}</span>
            </div>
          )}
        </div>

        {/* Levels */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>
              {getLevelLabel(objective.currentLevel)} → {getLevelLabel(objective.targetLevel)}
            </span>
          </div>
        </div>

        {/* Timeline */}
        {objective.targetTimeline > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Target duration: {objective.targetTimeline} months</span>
          </div>
        )}

        {/* Last Assessment Result */}
        {lastAssessment != null && (
          <div className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="font-medium">
              Last assessment: {lastAssessment.score}% ·{' '}
              {getLevelLabel(lastAssessment.skillLevel)}
            </span>
          </div>
        )}

        {/* Overall Progress */}
        {typeof objective.progress === 'number' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(objective.progress)}%</span>
            </div>
            <Progress value={objective.progress} />
          </div>
        )}

        {/* Milestones Progress */}
        {totalMilestones > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Milestones</span>
              <span className="font-medium">
                {completedMilestones}/{totalMilestones}
              </span>
            </div>
            <div className="flex gap-1">
              {objective.milestones.map(
                (milestone): JSX.Element => (
                  <div
                    key={milestone.id}
                    className={`h-2 flex-1 rounded transition-colors ${
                      milestone.isCompleted === true ? 'bg-green-500' : 'bg-muted'
                    }`}
                    title={milestone.title}
                  />
                )
              )}
            </div>
          </div>
        )}

        {/* Learning Paths Progress - Always show with fixed height */}
        <div className="space-y-2 min-h-[60px]">
          {totalPaths > 0 ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Learning Paths</span>
                <span className="font-medium">
                  {completedPaths}/{totalPaths} completed
                </span>
              </div>
              {avgPathProgress > 0 && (
                <div className="text-xs text-muted-foreground">
                  Average progress: {avgPathProgress}%
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Learning Paths</span>
              <span className="font-medium text-muted-foreground">No paths</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {needsAssessment ? (
          <Button className="w-full" asChild>
            <Link to={`/assessment/${objective.id}`}>Start Assessment</Link>
          </Button>
        ) : hasPaths ? (
          <Button className="w-full" asChild>
            <Link to={`/objectives/${objective.id}/paths`}>Continue</Link>
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link to={`/objectives/${objective.id}/paths`}>View Learning Paths</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
