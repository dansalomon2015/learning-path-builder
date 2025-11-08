import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Loader2, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { apiService } from '../services/api';
import type { RecoveryAssessment, RecoveryResult, QuizQuestion } from '../types';
import { Difficulty } from '../types';
import { toast } from 'react-hot-toast';

interface RecoveryAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: RecoveryResult) => void;
  objectiveId: string;
  objectiveTitle: string;
  missedDays: number;
  userId?: string;
}

export function RecoveryAssessmentModal({
  isOpen,
  onClose,
  onComplete,
  objectiveId,
  objectiveTitle,
  missedDays,
  userId: _userId,
}: RecoveryAssessmentModalProps): JSX.Element {
  const [assessment, setAssessment] = useState<RecoveryAssessment | null>(null);
  const [generating, setGenerating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  const [startTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RecoveryResult | null>(null);

  useEffect((): void => {
    if (isOpen && assessment == null && !generating) {
      void generateAssessment();
    }
  }, [isOpen]);

  useEffect((): (() => void) | undefined => {
    if (isOpen && assessment != null) {
      const interval = setInterval((): void => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return (): void => {
        clearInterval(interval);
      };
    }
    return undefined;
  }, [isOpen, assessment, startTime]);

  const generateAssessment = async (): Promise<void> => {
    setGenerating(true);
    try {
      const response = await apiService.generateRecoveryAssessment(objectiveId, missedDays);
      if (response.success && response.data != null) {
        setAssessment(response.data);
        setCurrentQuestionIndex(0);
        setAnswers(new Map());
      } else {
        const errorMessage = response.error?.message ?? 'Failed to generate assessment';
        toast.error(errorMessage);
        // If it's a cooldown error, don't close the modal to show the message
        if (!errorMessage.includes('attendre')) {
          onClose();
        }
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { error?: { message?: string } } };
      };
      const errorMessage =
        err.response?.data?.error?.message ??
        (error instanceof Error ? error.message : 'Failed to generate assessment');

      // Check if it's a 429 (Too Many Requests) - cooldown
      if (err.response?.status === 429 || errorMessage.includes('attendre')) {
        toast.error(errorMessage, { duration: 5000 });
      } else {
        toast.error(errorMessage);
        onClose();
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string | number): void => {
    setAnswers((prev: Map<string, string | number>): Map<string, string | number> => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  };

  const handleNext = (): void => {
    if (assessment != null && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (assessment == null) {
      return;
    }

    const allAnswered = assessment.questions.every((q: QuizQuestion): boolean => answers.has(q.id));
    if (!allAnswered) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = Array.from(answers.entries()).map(
        ([questionId, selectedAnswer]: [string, string | number]) => ({
          questionId,
          selectedAnswer,
        })
      );

      const response = await apiService.submitRecoveryAssessment(
        assessment.id,
        answersArray,
        timeSpent
      );
      if (response.success && response.data != null) {
        setResult(response.data);
        onComplete(response.data);
      } else {
        toast.error(response.error?.message ?? 'Failed to submit assessment');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message ?? 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case Difficulty.EASY:
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case Difficulty.MEDIUM:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case Difficulty.HARD:
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (generating) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Génération du test de récupération...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Cela peut prendre quelques secondes
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show cooldown message if user tries to generate while in cooldown
  // This will be handled by the error message in generateAssessment, but we can add a state if needed

  if (result != null) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result.passed ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  Récupération réussie !
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  Récupération échouée
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {result.passed
                ? `Vous avez récupéré ${result.recoveredDays} jour(s) !`
                : 'Vous devez obtenir au moins 70% pour récupérer votre série.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{Math.round(result.score)}%</div>
              <p className="text-muted-foreground">
                {result.correctAnswers} / {result.totalQuestions} réponses correctes
              </p>
              {result.averageTimePerQuestion != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Temps moyen par question : {Math.round(result.averageTimePerQuestion)}s
                </p>
              )}
            </div>
            {result.passed && (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-center">
                    Votre série est maintenant de <strong>{result.newStreak} jours</strong>
                  </p>
                </CardContent>
              </Card>
            )}
            {result.suspiciousPattern === true && (
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-center text-yellow-700 dark:text-yellow-400">
                    ⚠️ Votre temps de réponse est très rapide. Veuillez prendre le temps de
                    réfléchir aux questions.
                  </p>
                </CardContent>
              </Card>
            )}
            {/* Feedback pédagogique - afficher seulement si échec ou si demandé */}
            {result.feedback != null && result.feedback.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  {result.passed ? 'Détails des réponses' : 'Correction et explications'}
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {result.feedback.map(
                    (item, index): JSX.Element => (
                      <Card
                        key={item.questionId}
                        className={
                          item.correct
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        }
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-sm">Question {index + 1}</span>
                            {item.correct ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-sm font-medium">{item.question}</p>
                          <div className="space-y-1 text-xs">
                            <div>
                              <span className="font-medium">Votre réponse :</span>{' '}
                              <span className={item.correct ? 'text-green-600' : 'text-red-600'}>
                                {typeof item.userAnswer === 'number'
                                  ? `Option ${String.fromCharCode(65 + item.userAnswer)}`
                                  : item.userAnswer}
                              </span>
                            </div>
                            {!item.correct && (
                              <div>
                                <span className="font-medium">Bonne réponse :</span>{' '}
                                <span className="text-green-600">
                                  {typeof item.correctAnswer === 'number'
                                    ? `Option ${String.fromCharCode(65 + item.correctAnswer)}`
                                    : item.correctAnswer}
                                </span>
                              </div>
                            )}
                            <div className="pt-2">
                              <span className="font-medium">Explication :</span>
                              <p className="text-muted-foreground mt-1">{item.explanation}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (assessment == null) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const allAnswered = assessment.questions.every((q: QuizQuestion): boolean => answers.has(q.id));
  const selectedAnswer = answers.get(currentQuestion?.id ?? '');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{objectiveTitle}</DialogTitle>
          <DialogDescription>
            Test de récupération : {assessment.questionCount} questions • Score minimum : 70%
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                Question {currentQuestionIndex + 1} / {assessment.questions.length}
              </span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatTime(timeSpent)}</span>
              </div>
            </div>
            <Progress value={progress} />
          </div>

          {/* Question */}
          {currentQuestion != null && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant="outline"
                    className={getDifficultyColor(currentQuestion.difficulty)}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold mb-6">{currentQuestion.question}</h3>
                <div className="space-y-3">
                  {currentQuestion.options.map((option: string, index: number): JSX.Element => {
                    const isSelected =
                      selectedAnswer === option ||
                      selectedAnswer === index ||
                      selectedAnswer === String(index);
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={(): void => {
                          handleAnswerSelect(currentQuestion.id, option);
                        }}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
            {currentQuestionIndex === assessment.questions.length - 1 ? (
              <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  'Soumettre'
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={selectedAnswer == null}>
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
