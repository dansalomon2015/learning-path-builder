import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { LearningObjective, LearningPath, LearningModule } from '../types';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Play } from 'lucide-react';
import SuggestedResourcesPanel from '../components/SuggestedResourcesPanel';
import ModuleFlashcardStudy from '../components/ModuleFlashcardStudy';
import ValidationQuizModal from '../components/ValidationQuizModal';
import { ContentGenerationModal } from '../components/ContentGenerationModal';

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
  const [flashcardsComplete, setFlashcardsComplete] = useState(false);
  const [showValidationQuiz, setShowValidationQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

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

  const handleFlashcardsComplete = (): void => {
    setFlashcardsComplete(true);
  };

  const handleFlashcardProgressUpdate = async (
    masteryPercentage: number,
    masteredCardIds: string[]
  ): Promise<void> => {
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

    try {
      await apiService.trackFlashcardSession({
        objectiveId,
        pathId,
        moduleId,
        flashcardMastery: masteryPercentage,
        timeSpent: undefined,
        masteredCardIds, // IDs of mastered cards
      });
      // Update module locally to reflect changes
      if (module != null) {
        setModule({
          ...module,
          progress: masteryPercentage,
          masteredCardIds,
        });
      }
      // Silently update - don't reload to avoid interrupting study flow
    } catch (error: unknown) {
      console.error('Failed to save flashcard progress:', error);
      // Don't show error toast to avoid interrupting study flow
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
      <div className="p-6">
        <ContentGenerationModal
          isOpen={generatingContent}
          moduleTitle={module?.title ?? 'Loading...'}
          message="Generating flashcards and resources..."
        />
        <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (objective == null || path == null || module == null) {
    return (
      <div className="p-6">
        <div className="text-slate-600 text-sm mb-4">Module not found.</div>
        <button
          onClick={(): void => {
            navigate(-1);
          }}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
        >
          Back
        </button>
      </div>
    );
  }

  // Si pas de flashcards générées
  if (module.hasFlashcards !== true || module.flashcards.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={(): void => {
            if (objectiveId != null && pathId != null) {
              navigate(`/objectives/${objectiveId}/paths/${pathId}`);
            }
          }}
          className="mb-4 flex items-center space-x-2 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Path</span>
        </button>
        <div className="text-center py-12">
          <div className="text-slate-500 mb-4">Flashcards are being generated. Please wait...</div>
          <button
            onClick={(): void => {
              if (objectiveId != null && pathId != null) {
                navigate(`/objectives/${objectiveId}/paths/${pathId}`);
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={(): void => {
            if (objectiveId != null && pathId != null) {
              navigate(`/objectives/${objectiveId}/paths/${pathId}`);
            }
          }}
          className="mb-4 flex items-center space-x-2 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Path</span>
        </button>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{module.title}</h1>
            <p className="text-slate-600 text-sm">{module.description}</p>
          </div>
          <span className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
            {module.type}
          </span>
        </div>

        {module.progress > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>Module Progress</span>
              <span className="font-semibold">{module.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${module.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex gap-6">
        {/* Sidebar - Suggested Resources */}
        <aside className="w-80 flex-shrink-0">
          <SuggestedResourcesPanel resources={module.suggestedResources ?? []} />
        </aside>

        {/* Main - Flashcards Study */}
        <main className="flex-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <ModuleFlashcardStudy
              flashcards={module.flashcards}
              onComplete={handleFlashcardsComplete}
              onBack={(): void => {
                if (objectiveId != null && pathId != null) {
                  navigate(`/objectives/${objectiveId}/paths/${pathId}`);
                }
              }}
              objectiveId={objectiveId ?? ''}
              pathId={pathId ?? ''}
              moduleId={moduleId ?? ''}
              initialMasteredCardIds={module.masteredCardIds ?? []}
              onProgressUpdate={handleFlashcardProgressUpdate}
            />
          </div>

          {/* Ready for Validation Button */}
          {flashcardsComplete && !module.isCompleted && (
            <div className="mt-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Flashcards Review Complete!
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  You&apos;ve reviewed all flashcards. Ready to take the validation quiz?
                </p>
                <button
                  onClick={handleGenerateValidationQuiz}
                  disabled={generatingQuiz || showValidationQuiz}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingQuiz ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Quiz...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Start Validation Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Module Completed */}
          {module.isCompleted && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Module Completed!</h3>
              <p className="text-sm text-green-700 mb-4">
                Congratulations! You&apos;ve successfully completed this module.
              </p>
              <button
                onClick={(): void => {
                  if (objectiveId != null && pathId != null) {
                    navigate(`/objectives/${objectiveId}/paths/${pathId}`);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Continue to Next Module
              </button>
            </div>
          )}
        </main>
      </div>

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
    </div>
  );
};

export default ModuleLearnPage;
