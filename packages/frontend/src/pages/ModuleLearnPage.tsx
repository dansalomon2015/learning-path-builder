import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { LearningObjective, LearningPath, LearningModule } from '../types';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Play } from 'lucide-react';
import SuggestedResourcesPanel from '../components/SuggestedResourcesPanel';
import ModuleFlashcardStudy from '../components/ModuleFlashcardStudy';
import ValidationQuizModal from '../components/ValidationQuizModal';
import { ContentGenerationModal } from '../components/ContentGenerationModal';

const ModuleLearnPage: React.FC = () => {
  const { objectiveId, pathId, moduleId } = useParams<{
    objectiveId: string;
    pathId: string;
    moduleId: string;
  }>();
  const navigate = useNavigate();
  const [objective, setObjective] = useState<LearningObjective | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [module, setModule] = useState<LearningModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [flashcardsComplete, setFlashcardsComplete] = useState(false);
  const [showValidationQuiz, setShowValidationQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const reloadData = async () => {
    try {
      if (!objectiveId) return;
      const res = await apiService.getObjective(objectiveId);
      const obj = res.data as any as LearningObjective;
      setObjective(obj);
      const p = obj?.learningPaths?.find((lp: any) => lp.id === pathId) || null;
      setPath(p);
      const m = p?.modules?.find((mod: any) => mod.id === moduleId) || null;
      setModule(m);
    } catch (error) {
      toast.error('Failed to reload data');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!objectiveId || !pathId || !moduleId) return;
        const res = await apiService.getObjective(objectiveId);
        const obj = res.data as any as LearningObjective;
        setObjective(obj);
        const p = obj?.learningPaths?.find((lp: any) => lp.id === pathId) || null;
        setPath(p);
        const m = p?.modules?.find((mod: any) => mod.id === moduleId) || null;
        setModule(m);

        // Vérifier si les flashcards doivent être générées
        if (m && m.isEnabled && !m.hasFlashcards) {
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
              toast.error(contentRes?.error?.message || 'Failed to generate content');
            }
          } catch (error: any) {
            toast.error(error?.message || 'Failed to generate module content');
          } finally {
            setGeneratingContent(false);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [objectiveId, pathId, moduleId]);

  const handleFlashcardsComplete = () => {
    setFlashcardsComplete(true);
  };

  const handleFlashcardProgressUpdate = async (
    masteryPercentage: number,
    masteredCardIds: string[]
  ) => {
    if (!objectiveId || !pathId || !moduleId) return;

    try {
      await apiService.trackFlashcardSession(
        objectiveId,
        pathId,
        moduleId,
        masteryPercentage,
        undefined, // timeSpent
        masteredCardIds // IDs des cartes maîtrisées
      );
      // Mettre à jour le module localement pour refléter les changements
      if (module) {
        setModule({
          ...module,
          progress: masteryPercentage,
          masteredCardIds,
        });
      }
      // Silently update - don't reload to avoid interrupting study flow
    } catch (error) {
      console.error('Failed to save flashcard progress:', error);
      // Don't show error toast to avoid interrupting study flow
    }
  };

  const handleGenerateValidationQuiz = async () => {
    if (!objectiveId || !pathId || !moduleId) return;

    setGeneratingQuiz(true);
    try {
      const res = await apiService.generateModuleValidationQuiz(objectiveId, pathId, moduleId);
      if (res.success) {
        toast.success('Validation quiz generated');
        await reloadData();
        setShowValidationQuiz(true);
      } else {
        toast.error(res?.error?.message || 'Failed to generate validation quiz');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate validation quiz');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleValidateQuiz = async (
    answers: Array<{ questionId: string; selectedAnswer: string | number }>,
    timeSpent: number
  ) => {
    if (!objectiveId || !pathId || !moduleId) return;

    try {
      const res = await apiService.validateModule(
        objectiveId,
        pathId,
        moduleId,
        answers,
        timeSpent
      );
      if (res.success && res.data) {
        if (res.data.passed) {
          toast.success(`Congratulations! You passed with ${res.data.score}%`);
          await reloadData();
          setTimeout(() => {
            navigate(`/objectives/${objectiveId}/paths/${pathId}`);
          }, 1500);
        } else {
          toast.error(`You scored ${res.data.score}%. Need 70% to pass.`);
        }
        return res.data;
      } else {
        throw new Error(res?.error?.message || 'Failed to validate quiz');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to validate quiz');
      throw error;
    }
  };

  if (loading || generatingContent) {
    return (
      <div className="p-6">
        <ContentGenerationModal
          isOpen={generatingContent}
          moduleTitle={module?.title || 'Loading...'}
          message="Generating flashcards and resources..."
        />
        <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!objective || !path || !module) {
    return (
      <div className="p-6">
        <div className="text-slate-600 text-sm mb-4">Module not found.</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
        >
          Back
        </button>
      </div>
    );
  }

  // Si pas de flashcards générées
  if (!module.hasFlashcards || !module.flashcards || module.flashcards.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/objectives/${objectiveId}/paths/${pathId}`)}
          className="mb-4 flex items-center space-x-2 text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Path</span>
        </button>
        <div className="text-center py-12">
          <div className="text-slate-500 mb-4">Flashcards are being generated. Please wait...</div>
          <button
            onClick={() => navigate(`/objectives/${objectiveId}/paths/${pathId}`)}
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
          onClick={() => navigate(`/objectives/${objectiveId}/paths/${pathId}`)}
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
          <SuggestedResourcesPanel resources={module.suggestedResources || []} />
        </aside>

        {/* Main - Flashcards Study */}
        <main className="flex-1">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <ModuleFlashcardStudy
              flashcards={module.flashcards}
              onComplete={handleFlashcardsComplete}
              onBack={() => navigate(`/objectives/${objectiveId}/paths/${pathId}`)}
              objectiveId={objectiveId}
              pathId={pathId}
              moduleId={moduleId}
              initialMasteredCardIds={module.masteredCardIds || []}
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
                  You've reviewed all flashcards. Ready to take the validation quiz?
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
                Congratulations! You've successfully completed this module.
              </p>
              <button
                onClick={() => navigate(`/objectives/${objectiveId}/paths/${pathId}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Continue to Next Module
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Validation Quiz Modal */}
      {showValidationQuiz && module.validationQuiz && module.validationQuiz.length > 0 && (
        <ValidationQuizModal
          isOpen={showValidationQuiz}
          quiz={module.validationQuiz}
          moduleTitle={module.title}
          onClose={() => setShowValidationQuiz(false)}
          onSubmit={handleValidateQuiz}
          onPass={async () => {
            await reloadData();
          }}
          onFail={() => {
            // Optionally refresh to show updated state
          }}
        />
      )}
    </div>
  );
};

export default ModuleLearnPage;
