import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { LearningObjective, LearningPath, LearningModule, Flashcard } from '../types';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Loader2,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Logo } from '../components/Logo';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { FlashcardRating } from '../components/FlashcardRating';
import { ModuleResources } from '../components/ModuleResources';
import ValidationQuizModal from '../components/ValidationQuizModal';
import { ContentGenerationModal } from '../components/ContentGenerationModal';
import { ModuleFinalExamModal } from '../components/ModuleFinalExamModal';
import { cn } from '../lib/utils';

// eslint-disable-next-line complexity, max-lines-per-function
const ModuleLearnPage: React.FC = (): JSX.Element => {
  const params = useParams<{
    objectiveId: string;
    pathId: string;
    moduleId: string;
  }>();
  const objectiveId: string | undefined = params.objectiveId;
  const pathId: string | undefined = params.pathId;
  const moduleId: string | undefined = params.moduleId;
  const navigate = useNavigate();
  const [objective, setObjective] = useState<LearningObjective | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [module, setModule] = useState<LearningModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());
  const [showValidationQuiz, setShowValidationQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [finalExamEligibility, setFinalExamEligibility] = useState<{
    canTake: boolean;
    missingResources?: string[];
    reason?: string;
  } | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [moduleProgress, setModuleProgress] = useState<{
    progress: number;
    resourceWeight: number;
    finalExamWeight: number;
    resourceCount: number;
    completedResourceCount: number;
    finalExamPassed: boolean;
  } | null>(null);
  const [loadingModuleProgress, setLoadingModuleProgress] = useState(false);

  const reloadData = useCallback(async (): Promise<void> => {
    try {
      if (objectiveId == null || objectiveId === '') {
        return;
      }
      const res = await apiService.getObjective(objectiveId);
      const obj = res.data as unknown as LearningObjective;
      setObjective(obj);
      const p: LearningPath | null =
        obj.learningPaths.find((lp: LearningPath): boolean => lp.id === pathId) ?? null;
      setPath(p);
      const modules = p?.modules ?? [];
      const m: LearningModule | null =
        modules.find((mod: LearningModule): boolean => mod.id === moduleId) ?? null;
      setModule(m);
    } catch (error: unknown) {
      toast.error('Failed to reload data');
    }
  }, [objectiveId, pathId, moduleId]);

  useEffect((): (() => void) | undefined => {
    // eslint-disable-next-line complexity
    const load = async (): Promise<void> => {
      try {
        if (
          objectiveId == null ||
          objectiveId === '' ||
          pathId == null ||
          pathId === '' ||
          moduleId == null ||
          moduleId === ''
        ) {
          return;
        }
        const res = await apiService.getObjective(objectiveId);
        const obj = res.data as unknown as LearningObjective;
        setObjective(obj);
        const p: LearningPath | null =
          obj.learningPaths.find((lp: LearningPath): boolean => lp.id === pathId) ?? null;
        setPath(p);
        const modules = p?.modules ?? [];
        const m: LearningModule | null =
          modules.find((mod: LearningModule): boolean => mod.id === moduleId) ?? null;
        setModule(m);

        // Check final exam eligibility
        if (m != null && moduleId != null && moduleId !== '') {
          void checkFinalExamEligibility(moduleId);
          void loadModuleProgress();
        }

        // Check if flashcards need to be generated
        if (m != null && m.isEnabled === true && m.hasFlashcards !== true) {
          setGeneratingContent(true);
          try {
            const contentRes = await apiService.generateModuleContent(
              objectiveId,
              pathId,
              moduleId
            );
            if (contentRes.success) {
              toast.success('Flashcards and resources generated successfully');
              await reloadData();
            } else {
              const errorMsg = contentRes.error?.message ?? 'Failed to generate content';
              toast.error(errorMsg);
            }
          } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message ?? 'Failed to generate module content');
          } finally {
            setGeneratingContent(false);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load().catch((error: unknown): void => {
      console.error('Error loading module data:', error);
    });
    return undefined;
  }, [objectiveId, pathId, moduleId, reloadData]);

  const loadModuleProgress = useCallback(async (): Promise<void> => {
    if (objectiveId == null || pathId == null || moduleId == null) {
      return;
    }
    try {
      setLoadingModuleProgress(true);
      const res = await apiService.getModuleProgress(objectiveId, pathId, moduleId);
      if (res.success && res.data != null) {
        setModuleProgress(res.data);
      }
    } catch (error: unknown) {
      console.error('Error loading module progress:', error);
    } finally {
      setLoadingModuleProgress(false);
    }
  }, [objectiveId, pathId, moduleId]);

  useEffect((): void => {
    if (objectiveId != null && pathId != null && moduleId != null && module != null) {
      void loadModuleProgress();
    }
  }, [objectiveId, pathId, moduleId, module, loadModuleProgress]);

  const checkFinalExamEligibility = async (modId: string): Promise<void> => {
    try {
      setCheckingEligibility(true);
      const res = await apiService.checkModuleFinalExamEligibility(modId);
      if (res.success === true && res.data != null) {
        setFinalExamEligibility(res.data);
      }
    } catch (error: unknown) {
      console.error('Error checking final exam eligibility:', error);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleFlip = (): void => {
    setIsFlipped(!isFlipped);
    if (!isFlipped && module != null && currentIndex < module.flashcards.length) {
      const currentCard = module.flashcards[currentIndex];
      if (currentCard != null) {
        setStudiedCards(new Set(studiedCards).add(currentCard.id));
      }
    }
  };

  const handleNext = (): void => {
    if (module != null && currentIndex < module.flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = (): void => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleGenerateValidationQuiz = async (): Promise<void> => {
    if (
      objectiveId == null ||
      objectiveId === '' ||
      pathId == null ||
      pathId === '' ||
      moduleId == null ||
      moduleId === ''
    ) {
      return;
    }

    setGeneratingQuiz(true);
    try {
      const res = await apiService.generateModuleValidationQuiz(objectiveId, pathId, moduleId);
      if (res.success) {
        toast.success('Validation quiz generated');
        await reloadData();
        setShowValidationQuiz(true);
      } else {
        const errorMsg = res.error?.message ?? 'Failed to generate validation quiz';
        toast.error(errorMsg);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message ?? 'Failed to generate validation quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleValidateQuiz = async (
    answers: Array<{ questionId: string; selectedAnswer: string | number }>,
    timeSpent: number
  ): Promise<{
    score: number;
    passed: boolean;
    correctAnswers: number;
    totalQuestions: number;
    feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
    module: Record<string, unknown>;
  }> => {
    if (
      objectiveId == null ||
      objectiveId === '' ||
      pathId == null ||
      pathId === '' ||
      moduleId == null ||
      moduleId === ''
    ) {
      throw new Error('Missing required parameters');
    }

    try {
      const res = await apiService.validateModule(
        objectiveId,
        pathId,
        moduleId,
        answers,
        timeSpent
      );
      if (res.success && res.data != null) {
        if (res.data.passed) {
          toast.success(`Congratulations! You passed with ${res.data.score}%`);
          await reloadData();
          setTimeout((): void => {
            navigate(`/objectives/${objectiveId}/paths/${pathId}`);
          }, 1500);
        } else {
          toast.error(`You scored ${res.data.score}%. Need 70% to pass.`);
        }
        return res.data;
      } else {
        const errorMsg = res.error?.message ?? 'Failed to validate quiz';
        throw new Error(errorMsg);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message ?? 'Failed to validate quiz');
      throw error;
    }
  };

  if (loading || generatingContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <ContentGenerationModal
          isOpen={generatingContent}
          moduleTitle={module?.title ?? 'Loading...'}
          message="Generating flashcards and resources..."
        />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (objective == null || path == null || module == null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-2">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">Module not found.</p>
              <Button variant="outline" onClick={(): void => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Si pas de flashcards générées
  if (module.hasFlashcards !== true || module.flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={(): void => {
                if (objectiveId != null && pathId != null) {
                  navigate(`/objectives/${objectiveId}/paths/${pathId}`);
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-6">
                Flashcards are being generated. Please wait...
              </p>
              <Button
                onClick={(): void => {
                  if (objectiveId != null && pathId != null) {
                    navigate(`/objectives/${objectiveId}/paths/${pathId}`);
                  }
                }}
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const flashcards: Flashcard[] = module.flashcards;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const currentCard: Flashcard | undefined = flashcards[currentIndex];
  const flashcardProgress = flashcards.length > 0 ? (studiedCards.size / flashcards.length) * 100 : 0;
  const allCardsStudied = flashcards.length > 0 && studiedCards.size === flashcards.length;
  
  // Use module progress (weighted: resources + final exam) if available, otherwise fallback to flashcard progress
  const moduleProgressValue = moduleProgress?.progress ?? (typeof module.progress === 'number' ? module.progress : flashcardProgress);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={(): void => {
                  if (objectiveId != null && pathId != null) {
                    navigate(`/objectives/${objectiveId}/paths/${pathId}`);
                  }
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Logo size="md" />
                <div>
                  <h1 className="font-semibold">{module.title}</h1>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{Math.round(moduleProgressValue)}%</div>
              <p className="text-xs text-muted-foreground">
                {moduleProgress != null
                  ? `Module: ${moduleProgress.completedResourceCount}/${moduleProgress.resourceCount} resources${moduleProgress.finalExamPassed ? ' + Exam' : ''}`
                  : 'Progress'}
              </p>
            </div>
          </div>
          <Progress value={moduleProgressValue} className="mt-4" />
          {moduleProgress != null && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span>
                Progress based on resources ({moduleProgress.resourceWeight}% each) and final exam ({moduleProgress.finalExamWeight}%)
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Flashcard */}
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
        {currentCard != null ? (
          <div className="mb-8">
            <div
              className="relative h-[400px] cursor-pointer perspective-1000"
              onClick={handleFlip}
            >
              <div
                className={cn(
                  'absolute inset-0 transition-transform duration-500 transform-style-3d',
                  isFlipped && 'rotate-y-180'
                )}
              >
                {/* Front of card */}
                <Card
                  className={cn('absolute inset-0 border-2 backface-hidden', !isFlipped && 'z-10')}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="mb-4 text-sm font-medium text-primary">Question</div>
                    <h2 className="text-2xl md:text-3xl font-bold text-balance leading-relaxed">
                      {currentCard.question}
                    </h2>
                    <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
                      <RotateCw className="h-4 w-4" />
                      <span>Cliquez pour voir la réponse</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Back of card */}
                <Card
                  className={cn(
                    'absolute inset-0 border-2 backface-hidden rotate-y-180',
                    isFlipped && 'z-10'
                  )}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="mb-4 text-sm font-medium text-green-500">Réponse</div>
                    <p className="text-lg md:text-xl leading-relaxed text-pretty">
                      {currentCard.answer}
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
                      <RotateCw className="h-4 w-4" />
                      <span>Cliquez pour voir la question</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : null}

        {/* Rating component below flashcard */}
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
        {currentCard != null ? (
          <div className="mb-6">
            <FlashcardRating
              flashcardId={currentCard.id}
              onRatingChange={(_rating: number, _comment: string): void => {
                // TODO: Save to backend
              }}
            />
          </div>
        ) : null}

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Précédent
          </Button>

          <div className="flex items-center gap-2">
            {flashcards.map(
              (card: Flashcard, index: number): JSX.Element => (
                <button
                  key={card.id}
                  type="button"
                  onClick={(): void => {
                    setCurrentIndex(index);
                    setIsFlipped(false);
                  }}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    index === currentIndex
                      ? 'w-8 bg-primary'
                      : studiedCards.has(card.id)
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-muted'
                  )}
                />
              )
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Resources section */}
        <div className="mb-6">
          <ModuleResources
            resources={module.suggestedResources ?? []}
            moduleId={moduleId ?? ''}
            objectiveId={objectiveId ?? ''}
            onAssessmentComplete={async (_resourceId: string): Promise<void> => {
              // Reload module progress after resource assessment completion
              await loadModuleProgress();
              // Re-evaluate eligibility after resource assessment is completed
              if (moduleId != null && moduleId !== '') {
                await checkFinalExamEligibility(moduleId);
              }
            }}
          />
        </div>

        {/* Final Exam Section */}
        {!module.isCompleted && module.suggestedResources != null && module.suggestedResources.length > 0 && (
          <Card className="mb-6 border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Module Final Exam</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    To take the final exam and complete this module, you must first pass
                    at least one self-assessment test (with a score of 80% or more) for each
                    suggested resource in the module.
                  </p>
                  {checkingEligibility ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking eligibility...
                    </div>
                  ) : finalExamEligibility != null ? (
                    <>
                      {finalExamEligibility.canTake ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>You are eligible to take the final exam</span>
                          </div>
                          <Button
                            onClick={(): void => {
                              setShowFinalExam(true);
                            }}
                            className="w-full sm:w-auto"
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            Take Final Exam
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                              {finalExamEligibility.reason ??
                                'You must complete the prerequisites to take the final exam'}
                            </span>
                          </div>
                          {finalExamEligibility.missingResources != null &&
                            finalExamEligibility.missingResources.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium mb-1">Resources to complete:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {finalExamEligibility.missingResources.map((resource, index) => (
                                    <li key={index}>{resource}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Card */}
        {allCardsStudied && !module.isCompleted && (
          <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10 mb-6">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-2xl font-bold">Module Completed!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You have studied all flashcards. Take the validation quiz to unlock the next module.
              </p>
              <Button
                size="lg"
                onClick={handleGenerateValidationQuiz}
                disabled={generatingQuiz || showValidationQuiz}
              >
                {generatingQuiz ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération du quiz...
                  </>
                ) : (
                  'Passer le quiz de validation'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Module Completed */}
        {module.isCompleted && (
          <Card className="border-2 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 mb-6">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-2xl font-bold">Module Completed!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Congratulations! You have successfully completed this module.
              </p>
              <Button
                size="lg"
                onClick={(): void => {
                  if (objectiveId != null && pathId != null) {
                    navigate(`/objectives/${objectiveId}/paths/${pathId}`);
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Continue to Next Module
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Study Tips */}
        <Card className="mt-6 border-2">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Conseils d&apos;étude</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>
                  Prenez le temps de bien comprendre chaque concept avant de passer au suivant
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>Révisez régulièrement les flashcards pour renforcer votre mémoire</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>N&apos;hésitez pas à revenir sur les cartes que vous trouvez difficiles</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>

      {/* Validation Quiz Modal */}
      {showValidationQuiz === true &&
      module.validationQuiz != null &&
      module.validationQuiz.length > 0 ? (
        <ValidationQuizModal
          isOpen={showValidationQuiz}
          quiz={module.validationQuiz}
          moduleTitle={module.title}
          onClose={(): void => {
            setShowValidationQuiz(false);
          }}
          onSubmit={handleValidateQuiz}
          onPass={async (): Promise<void> => {
            await reloadData();
          }}
          onFail={(): void => {
            // Optionally refresh to show updated state
          }}
        />
      ) : null}

      {/* Final Exam Modal */}
      {moduleId != null && pathId != null && objectiveId != null && (
        <ModuleFinalExamModal
          isOpen={showFinalExam}
          moduleId={moduleId}
          pathId={pathId}
          objectiveId={objectiveId}
          moduleTitle={module.title}
          onClose={(): void => {
            setShowFinalExam(false);
          }}
          onComplete={async (): Promise<void> => {
            await reloadData();
            await loadModuleProgress();
            setShowFinalExam(false);
          }}
        />
      )}
    </div>
  );
};

export default ModuleLearnPage;

