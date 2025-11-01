import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { LearningObjective, LearningPath, LearningModule } from '../types';
import { toast } from 'react-hot-toast';
import { ContentGenerationModal } from '../components/ContentGenerationModal';
import { Lock, CheckCircle2, Play } from 'lucide-react';

const ObjectivePathPage: React.FC = () => {
  const { objectiveId, pathId } = useParams<{ objectiveId: string; pathId: string }>();
  const navigate = useNavigate();
  const [objective, setObjective] = useState<LearningObjective | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingContent, setGeneratingContent] = useState<string | null>(null); // moduleId
  const [loadingModule, setLoadingModule] = useState<string | null>(null); // moduleId
  const [generatingModules, setGeneratingModules] = useState(false);
  const [moduleGenerationError, setModuleGenerationError] = useState<string | null>(null);
  const generationAttemptedRef = useRef(false);
  const isGeneratingRef = useRef(false);

  const reloadData = async () => {
    try {
      if (!objectiveId) return;
      const res = await apiService.getObjective(objectiveId);
      const obj = res.data as any as LearningObjective;
      setObjective(obj);
      const p = obj?.learningPaths?.find((lp: any) => lp.id === pathId) || null;
      setPath(p);
    } catch (error) {
      toast.error('Failed to reload data');
    }
  };

  const generateModules = async (isRetry = false) => {
    if (!objectiveId || !pathId) {
      console.warn('generateModules: missing objectiveId or pathId');
      return;
    }

    // Prévenir les appels multiples simultanés
    if (isGeneratingRef.current && !isRetry) {
      console.warn('generateModules: already generating, skipping');
      return;
    }

    // Vérifier une dernière fois que les modules n'existent pas déjà (double vérification)
    if (path && Array.isArray(path.modules) && path.modules.length > 0) {
      console.log('generateModules: modules already exist, skipping generation', {
        modulesCount: path.modules.length,
      });
      return;
    }

    console.log('generateModules: starting generation', { objectiveId, pathId, isRetry });
    isGeneratingRef.current = true;
    setGeneratingModules(true);
    setModuleGenerationError(null);
    if (!isRetry) {
      generationAttemptedRef.current = true;
    }
    try {
      const res = await apiService.generatePathModules(objectiveId, pathId);
      if (res.success) {
        toast.success('Modules generated successfully');
        await reloadData();
      } else {
        const errorMsg = res?.error?.message || 'Failed to generate modules';
        setModuleGenerationError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to generate modules';
      setModuleGenerationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setGeneratingModules(false);
      isGeneratingRef.current = false;
    }
  };

  useEffect(() => {
    // Reset refs when objectiveId or pathId changes
    generationAttemptedRef.current = false;
    isGeneratingRef.current = false;
    setModuleGenerationError(null);
    let isMounted = true;

    const load = async () => {
      try {
        if (!objectiveId) return;

        const res = await apiService.getObjective(objectiveId);
        if (!isMounted) return;

        const obj = res.data as any as LearningObjective;
        setObjective(obj);
        const p = obj?.learningPaths?.find((lp: any) => lp.id === pathId) || null;
        setPath(p);

        // Mettre loading à false dès qu'on a les données, pour afficher le contenu
        setLoading(false);

        // Vérifier que le path existe et qu'on a bien reçu les données
        if (!p) {
          return;
        }

        // Vérifier explicitement que modules existe et est un array
        // Si p.modules est undefined, null, ou pas un array, on considère qu'il n'y a pas de modules
        const modulesArray = Array.isArray(p.modules) ? p.modules : [];

        // Auto-générer les modules UNIQUEMENT si :
        // 1. On est toujours monté
        // 2. Le path existe
        // 3. modules est un array vide (explicitement vide, pas undefined/null)
        // 4. On n'a pas déjà tenté la génération
        // 5. On n'est pas déjà en train de générer
        if (
          isMounted &&
          p &&
          modulesArray.length === 0 &&
          !generationAttemptedRef.current &&
          !isGeneratingRef.current
        ) {
          generationAttemptedRef.current = true;
          // Lancer la génération sans attendre (non-bloquant pour l'UI)
          generateModules(false).catch(err => {
            console.error('Error generating modules:', err);
          });
        }
      } catch (error) {
        if (isMounted) {
          setLoading(false);
          toast.error('Failed to load objective');
        }
      }
    };
    load();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectiveId, pathId]);

  const handleStartModule = async (module: LearningModule) => {
    if (!objectiveId || !pathId) return;

    try {
      setLoadingModule(module.id);

      // Si le module n'a pas de flashcards, générer flashcards et ressources
      if (!module.hasFlashcards) {
        setGeneratingContent(module.id);
        try {
          const contentRes = await apiService.generateModuleContent(objectiveId, pathId, module.id);
          if (!contentRes.success) {
            throw new Error(contentRes?.error?.message || 'Failed to generate flashcards');
          }
          toast.success('Flashcards and resources generated successfully');
          await reloadData();
        } catch (error: any) {
          toast.error(error?.message || 'Failed to generate module content');
          setGeneratingContent(null);
          setLoadingModule(null);
          return;
        }
        setGeneratingContent(null);
      }

      // Rediriger vers la page d'apprentissage
      navigate(`/objectives/${objectiveId}/paths/${pathId}/modules/${module.id}/learn`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to start module');
    } finally {
      setLoadingModule(null);
    }
  };

  const handleCompleteModule = async (module: LearningModule) => {
    if (!objectiveId || !pathId) return;

    try {
      setLoadingModule(module.id);
      const res = await apiService.completeModule(objectiveId, pathId, module.id);
      if (res.success) {
        toast.success('Module marked as completed');
        await reloadData();
      } else {
        toast.error(res?.error?.message || 'Failed to complete module');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to complete module');
    } finally {
      setLoadingModule(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!objective || !path) {
    return (
      <div className="p-6">
        <div className="text-slate-600 text-sm mb-4">Path not found.</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{path.title}</h1>
          <p className="text-slate-600">{objective.title}</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="mb-4 text-sm text-slate-600">
        <span className="font-semibold">Difficulty:</span> {path.difficulty}
        <span className="mx-2">•</span>
        <span className="font-semibold">Estimated:</span> {path.estimatedDuration} weeks
        <span className="mx-2">•</span>
        <span className="font-semibold">Skills:</span> {path.skills.join(', ')}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">Modules</h2>
          {path.progress > 0 && (
            <div className="text-sm text-slate-600">
              Progress: <span className="font-semibold">{path.progress}%</span>
            </div>
          )}
        </div>
        {!path.modules || path.modules.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
            {generatingModules ? (
              <div className="space-y-4">
                <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-1">
                    Generating learning modules...
                  </p>
                  <p className="text-xs text-slate-600">Creating modules for this learning path</p>
                </div>
              </div>
            ) : moduleGenerationError ? (
              <div className="space-y-4">
                <div className="text-red-600">
                  <p className="text-sm font-semibold mb-1">Failed to generate modules</p>
                  <p className="text-xs text-red-500">{moduleGenerationError}</p>
                </div>
                <button
                  onClick={() => generateModules(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center space-x-2 mx-auto"
                >
                  <span>Retry</span>
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-500">Generating modules...</div>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {path.modules.map((m: LearningModule) => {
              const isEnabled = m.isEnabled ?? false;
              const hasFlashcards = m.hasFlashcards ?? false;
              const progress = m.progress ?? 0;
              const isCompleted = m.isCompleted ?? false;
              const isLoading = generatingContent === m.id || loadingModule === m.id;

              return (
                <li
                  key={m.id}
                  className={`border rounded-lg p-4 ${
                    !isEnabled
                      ? 'border-slate-200 bg-slate-50 opacity-60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {!isEnabled && <Lock className="w-4 h-4 text-slate-400" />}
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        <div className="text-sm font-semibold text-slate-800">{m.title}</div>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {m.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mb-2">{m.description}</div>
                      {hasFlashcards && progress > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                            <span>Progress</span>
                            <span className="font-semibold">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {m.dueDate && (
                        <div className="text-xs text-slate-500 mt-1">
                          Due: {new Date(m.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      onClick={async () => {
                        if (!isEnabled) {
                          toast.error('This module is locked. Complete previous modules first.');
                          return;
                        }
                        await handleStartModule(m);
                      }}
                      disabled={!isEnabled || isLoading}
                      className={`px-4 py-2 rounded-md text-xs font-semibold flex items-center space-x-1 transition-colors ${
                        !isEnabled
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : isLoading
                          ? 'bg-indigo-400 text-white cursor-wait'
                          : hasFlashcards
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                          : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{hasFlashcards ? 'Loading...' : 'Generating...'}</span>
                        </>
                      ) : hasFlashcards ? (
                        <>
                          <Play className="w-3 h-3" />
                          <span>Continue</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span>Start</span>
                        </>
                      )}
                    </button>
                    {isCompleted && (
                      <button
                        onClick={async () => {
                          await handleCompleteModule(m);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mark Incomplete</span>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {path.isCompleted ? (
        <div className="flex items-center space-x-2">
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Path Completed</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              if (!path.isEnabled) {
                toast.error('This path is locked. Complete previous paths first.');
                return;
              }
              const firstEnabledModule = path.modules.find((m: any) => m.isEnabled);
              if (firstEnabledModule) {
                await handleStartModule(firstEnabledModule);
              } else {
                toast('No enabled modules available', { icon: 'ℹ️' });
              }
            }}
            disabled={!path.isEnabled}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 ${
              path.isEnabled
                ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Start Path</span>
          </button>
          <button
            onClick={async () => {
              try {
                const res = await apiService.completeLearningPath(objectiveId!, pathId!);
                if (res.success) {
                  toast.success('Path marked as completed');
                  await reloadData();
                } else {
                  toast.error(res?.error?.message || 'Failed to complete path');
                }
              } catch (e) {
                toast.error('Failed to complete path');
              }
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
          >
            Mark as Completed
          </button>
        </div>
      )}

      <ContentGenerationModal
        isOpen={generatingContent !== null}
        moduleTitle={path.modules.find((m: any) => m.id === generatingContent)?.title || ''}
        message="Génération du contenu d'apprentissage en cours..."
      />
    </div>
  );
};

export default ObjectivePathPage;
