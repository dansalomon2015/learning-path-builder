import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '../services/api';
import { ObjectiveSelectionModal } from './ObjectiveSelectionModal';
import { RecoveryAssessmentModal } from './RecoveryAssessmentModal';
import type { LearningObjective, RecoveryResult } from '../types';
import { toast } from 'react-hot-toast';

interface StreakCardProps {
  userId: string;
}

export function StreakCard({ userId }: StreakCardProps): JSX.Element {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [showObjectiveSelection, setShowObjectiveSelection] = useState(false);
  const [showRecoveryAssessment, setShowRecoveryAssessment] = useState(false);
  const [missedDays, setMissedDays] = useState(0);
  const [selectedObjective, setSelectedObjective] = useState<LearningObjective | null>(null);

  useEffect((): void => {
    if (userId !== '') {
      void loadStreakData();
    }
  }, [userId]);

  const loadStreakData = async (): Promise<void> => {
    try {
      // Load full streak data
      const streakResponse = await apiService.getStreak(userId);
      if (streakResponse.success && streakResponse.data != null) {
        const streak = streakResponse.data;
        setCurrentStreak(streak.currentStreak);
        setLongestStreak(streak.longestStreak);
        setMissedDays(streak.missedDays);
      } else {
        // Fallback: try to get missed days only
        const missedDaysResponse = await apiService.getMissedDays(userId);
        if (missedDaysResponse.success && missedDaysResponse.data != null) {
          setMissedDays(missedDaysResponse.data.missedDays);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message ?? 'Failed to load streak data');
    }
  };

  const handleRecoverStreak = (): void => {
    setShowObjectiveSelection(true);
  };

  const handleObjectiveSelected = (
    objective: LearningObjective,
    _missedDaysCount: number
  ): void => {
    setSelectedObjective(objective);
    setShowObjectiveSelection(false);
    setShowRecoveryAssessment(true);
  };

  const handleRecoveryComplete = (result: RecoveryResult): void => {
    if (result.passed) {
      toast.success(`Récupération réussie ! ${result.recoveredDays} jour(s) récupéré(s)`);
      // Reload all streak data to get updated longestStreak if needed
      void loadStreakData();
    } else {
      toast.error(`Récupération échouée. Score: ${Math.round(result.score)}% (minimum: 70%)`);
    }
    setShowRecoveryAssessment(false);
    setSelectedObjective(null);
  };

  return (
    <>
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl" />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Série d&apos;apprentissage</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Flame
                  className={cn(
                    'h-8 w-8',
                    currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
                  )}
                />
                {currentStreak}
              </div>
              <p className="text-xs text-muted-foreground">Jours consécutifs</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span>Record : {longestStreak}</span>
            </div>
          </div>

          {missedDays > 0 && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>{missedDays} jour(s) manqué(s)</span>
                </div>
                <Button size="sm" variant="outline" onClick={handleRecoverStreak}>
                  Récupérer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ObjectiveSelectionModal
        isOpen={showObjectiveSelection}
        onClose={(): void => setShowObjectiveSelection(false)}
        onSelectObjective={handleObjectiveSelected}
        userId={userId}
        missedDays={missedDays}
      />

      {selectedObjective != null && (
        <RecoveryAssessmentModal
          isOpen={showRecoveryAssessment}
          onClose={(): void => {
            setShowRecoveryAssessment(false);
            setSelectedObjective(null);
          }}
          onComplete={handleRecoveryComplete}
          objectiveId={selectedObjective.id}
          objectiveTitle={selectedObjective.title}
          missedDays={missedDays}
          userId={userId}
        />
      )}
    </>
  );
}
