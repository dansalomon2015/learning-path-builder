import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, Target, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/api';
import type { LearningObjective } from '../types';
import { toast } from 'react-hot-toast';

interface ObjectiveSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectObjective: (objective: LearningObjective, missedDays: number) => void;
  userId: string;
  missedDays: number;
}

export function ObjectiveSelectionModal({
  isOpen,
  onClose,
  onSelectObjective,
  userId,
  missedDays,
}: ObjectiveSelectionModalProps): JSX.Element {
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedObjective, setSelectedObjective] = useState<LearningObjective | null>(null);

  const loadObjectives = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiService.getActiveObjectivesForRecovery(userId);
      if (response.success && response.data != null) {
        setObjectives(response.data);
      } else {
        toast.error(response.error?.message ?? 'Failed to load objectives');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message ?? 'Failed to load objectives');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect((): undefined => {
    if (isOpen && userId !== '') {
      loadObjectives().catch((error: unknown): void => {
        console.error('Error loading objectives:', error);
      });
    }
    return undefined;
  }, [isOpen, userId, loadObjectives]);

  const calculateQuestionCount = (days: number): number => {
    const MAX_RECOVERY_DAYS = 7;
    const recoverableDays = Math.min(days, MAX_RECOVERY_DAYS);
    const calculated = recoverableDays * 10;
    return Math.min(calculated, 30);
  };

  const handleSelect = (objective: LearningObjective): void => {
    setSelectedObjective(objective);
  };

  const handleConfirm = (): void => {
    if (selectedObjective != null) {
      onSelectObjective(selectedObjective, missedDays);
    }
  };

  const questionCount = calculateQuestionCount(missedDays);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Sélectionner un objectif pour récupérer
          </DialogTitle>
          <DialogDescription>
            Choisissez un objectif actif pour générer un test de récupération. Vous devrez répondre
            à {questionCount} questions (10 par jour manqué, maximum 30). Vous pouvez récupérer
            jusqu&apos;à 7 jours maximum.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : objectives.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Aucun objectif actif trouvé. Vous devez avoir au moins un objectif en cours pour
              récupérer votre série.
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-4">
            {objectives.map(
              (objective: LearningObjective): JSX.Element => (
                <Card
                  key={objective.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedObjective?.id === objective.id ? 'border-primary border-2' : ''
                  }`}
                  onClick={(): void => handleSelect(objective)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{objective.title}</CardTitle>
                      {selectedObjective?.id === objective.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {objective.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{objective.category}</span>
                      <span>•</span>
                      <span>{objective.targetRole}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={selectedObjective == null || loading}>
            {selectedObjective != null ? (
              <>
                <Target className="h-4 w-4 mr-2" />
                Continuer ({questionCount} questions)
              </>
            ) : (
              'Sélectionner un objectif'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
