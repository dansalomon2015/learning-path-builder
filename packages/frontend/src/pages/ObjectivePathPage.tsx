import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { LearningObjective, LearningPath, LearningModule } from '../types';
import { toast } from 'react-hot-toast';
import { ContentGenerationModal } from '../components/ContentGenerationModal';
import { Lock, CheckCircle2, Play } from 'lucide-react';

// Helper function to find path by ID
const findPathById = (
  learningPaths: LearningPath[] | undefined,
  pathId: string | undefined
): LearningPath | null => {
  if (learningPaths == null || pathId == null || pathId === '') {
    return null;
  }
  return learningPaths.find((lp: LearningPath): boolean => lp.id === pathId) ?? null;
};

// Helper function to check if modules should be auto-generated
const shouldAutoGenerateModules = (
  isMounted: boolean,
  path: LearningPath | null,
  generationAttempted: boolean,
  isGenerating: boolean
): boolean => {
  if (isMounted !== true || path == null) {
    return false;
  }
  const modulesArray = Array.isArray(path.modules) ? path.modules : [];
  return modulesArray.length === 0 && generationAttempted === false && isGenerating === false;
};

// Helper function to generate module content if needed
const generateModuleContentIfNeeded = async (
  objectiveId: string,
  pathId: string,
  module: LearningModule,
  setGeneratingContent: (id: string | null) => void,
  reloadData: () => Promise<void>
): Promise<void> => {
  if (module.hasFlashcards === true) {
    return;
  }
  setGeneratingContent(module.id);
  try {
    const contentRes = await apiService.generateModuleContent(objectiveId, pathId, module.id);
    if (!contentRes.success) {
      const errorMsg = contentRes.error?.message ?? 'Failed to generate flashcards';
      throw new Error(errorMsg);
    }
    toast.success('Flashcards and resources generated successfully');
    await reloadData();
  } catch (error: unknown) {
    const err = error as { message?: string };
    toast.error(err.message ?? 'Failed to generate module content');
    throw error;
  } finally {
    setGeneratingContent(null);
  }
};

// Helper component for module card
interface ModuleCardProps {
  module: LearningModule;
  isEnabled: boolean;
  hasFlashcards: boolean;
  progress: number;
  isCompleted: boolean;
  isLoading: boolean;
  onStartModule: (module: LearningModule) => Promise<void>;
  onCompleteModule: (module: LearningModule) => Promise<void>;
}

// Helper component for module progress bar
interface ModuleProgressProps {
  hasFlashcards: boolean;
  progress: number;
}

const ModuleProgress: React.FC<ModuleProgressProps> = ({
  hasFlashcards,
  progress,
}): JSX.Element | null => {
  if (!hasFlashcards || progress <= 0) {
    return null;
  }
  return (
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
  );
};

// Helper component for module button
interface ModuleButtonProps {
  isEnabled: boolean;
  isLoading: boolean;
  hasFlashcards: boolean;
  onStart: () => Promise<void>;
}

const ModuleButton: React.FC<ModuleButtonProps> = ({
  isEnabled,
  isLoading,
  hasFlashcards,
  onStart,
}): JSX.Element => {
  const handleClick = async (): Promise<void> => {
    if (!isEnabled) {
      toast.error('This module is locked. Complete previous modules first.');
      return;
    }
    await onStart();
  };

  return (
    <button
      onClick={handleClick}
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
  );
};

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isEnabled,
  hasFlashcards,
  progress,
  isCompleted,
  isLoading,
  onStartModule,
  onCompleteModule,
}): JSX.Element => {
  const handleStart = async (): Promise<void> => {
    await onStartModule(module);
  };

  const handleComplete = async (): Promise<void> => {
    await onCompleteModule(module);
  };

  return (
    <li
      className={`border rounded-lg p-4 ${
        !isEnabled ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            {!isEnabled && <Lock className="w-4 h-4 text-slate-400" />}
            {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            <div className="text-sm font-semibold text-slate-800">{module.title}</div>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
              {module.type}
            </span>
          </div>
          <div className="text-xs text-slate-600 mb-2">{module.description}</div>
          <ModuleProgress hasFlashcards={hasFlashcards} progress={progress} />
          {module.dueDate != null && module.dueDate !== '' ? (
            <div className="text-xs text-slate-500 mt-1">
              Due: {new Date(module.dueDate).toLocaleDateString()}
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex items-center space-x-2">
        <ModuleButton
          isEnabled={isEnabled}
          isLoading={isLoading}
          hasFlashcards={hasFlashcards}
          onStart={handleStart}
        />
        {isCompleted && (
          <button
            onClick={handleComplete}
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
};

// Helper component for modules list section
interface ModulesListProps {
  modules: LearningModule[];
  generatingModules: boolean;
  moduleGenerationError: string | null;
  generatingContent: string | null;
  loadingModule: string | null;
  pathProgress: number;
  onRetryGenerate: () => Promise<void>;
  onStartModule: (module: LearningModule) => Promise<void>;
  onCompleteModule: (module: LearningModule) => Promise<void>;
}

const ModulesList: React.FC<ModulesListProps> = ({
  modules,
  generatingModules,
  moduleGenerationError,
  generatingContent,
  loadingModule,
  pathProgress,
  onRetryGenerate,
  onStartModule,
  onCompleteModule,
}): JSX.Element => {
  if (modules.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-800">Modules</h2>
          {pathProgress > 0 && (
            <div className="text-sm text-slate-600">
              Progress: <span className="font-semibold">{pathProgress}%</span>
            </div>
          )}
        </div>
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
          ) : moduleGenerationError !== '' ? (
            <div className="space-y-4">
              <div className="text-red-600">
                <p className="text-sm font-semibold mb-1">Failed to generate modules</p>
                <p className="text-xs text-red-500">{moduleGenerationError}</p>
              </div>
              <button
                onClick={onRetryGenerate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center space-x-2 mx-auto"
              >
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Generating modules...</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-800">Modules</h2>
        {pathProgress > 0 && (
          <div className="text-sm text-slate-600">
            Progress: <span className="font-semibold">{pathProgress}%</span>
          </div>
        )}
      </div>
      <ul className="space-y-3">
        {modules.map((m: LearningModule): JSX.Element => {
          const isEnabled: boolean = m.isEnabled === true;
          const hasFlashcards: boolean = m.hasFlashcards === true;
          const progress: number = typeof m.progress === 'number' ? m.progress : 0;
          const isCompleted: boolean = m.isCompleted === true;
          const isLoading: boolean =
            (generatingContent != null && generatingContent === m.id) ||
            (loadingModule != null && loadingModule === m.id);

          return (
            <ModuleCard
              key={m.id}
              module={m}
              isEnabled={isEnabled}
              hasFlashcards={hasFlashcards}
              progress={progress}
              isCompleted={isCompleted}
              isLoading={isLoading}
              onStartModule={onStartModule}
              onCompleteModule={onCompleteModule}
            />
          );
        })}
      </ul>
    </div>
  );
};

// Helper component for path header
interface PathHeaderProps {
  pathTitle: string;
  objectiveTitle: string;
  difficulty: string;
  estimatedDuration: number;
  skills: string[];
  onBackToDashboard: () => void;
}

const PathHeader: React.FC<PathHeaderProps> = ({
  pathTitle,
  objectiveTitle,
  difficulty,
  estimatedDuration,
  skills,
  onBackToDashboard,
}): JSX.Element => (
  <>
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{pathTitle}</h1>
        <p className="text-slate-600">{objectiveTitle}</p>
      </div>
      <button
        onClick={onBackToDashboard}
        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
      >
        Back to Dashboard
      </button>
    </div>

    <div className="mb-4 text-sm text-slate-600">
      <span className="font-semibold">Difficulty:</span> {difficulty}
      <span className="mx-2">•</span>
      <span className="font-semibold">Estimated:</span> {estimatedDuration} weeks
      <span className="mx-2">•</span>
      <span className="font-semibold">Skills:</span> {skills.join(', ')}
    </div>
  </>
);

// Helper component for path action buttons
interface PathActionsProps {
  isCompleted: boolean;
  isEnabled: boolean;
  objectiveId: string | undefined;
  pathId: string | undefined;
  onStartPath: () => Promise<void>;
  onCompletePath: () => Promise<void>;
}

const PathActions: React.FC<PathActionsProps> = ({
  isCompleted,
  isEnabled,
  objectiveId,
  pathId,
  onStartPath,
  onCompletePath,
}): JSX.Element => {
  if (isCompleted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Path Completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onStartPath}
        disabled={!isEnabled}
        className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 ${
          isEnabled === true
            ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        <Play className="w-4 h-4" />
        <span>Start Path</span>
      </button>
      <button
        onClick={onCompletePath}
        disabled={objectiveId == null || pathId == null}
        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
      >
        Mark as Completed
      </button>
    </div>
  );
};

// eslint-disable-next-line max-lines-per-function
const ObjectivePathPage: React.FC = (): JSX.Element => {
  const params = useParams<{ objectiveId: string; pathId: string }>();
  const objectiveId: string | undefined = params.objectiveId;
  const pathId: string | undefined = params.pathId;
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

  const reloadData = async (): Promise<void> => {
    try {
      if (objectiveId == null || objectiveId === '') {
        return;
      }
      const res = await apiService.getObjective(objectiveId);
      const obj = res.data as unknown as LearningObjective;
      setObjective(obj);
      const learningPaths: LearningPath[] | undefined = obj.learningPaths;
      const p: LearningPath | null = findPathById(learningPaths, pathId);
      setPath(p);
    } catch (error: unknown) {
      toast.error('Failed to reload data');
    }
  };

  const generateModules = async (isRetry = false): Promise<void> => {
    if (objectiveId == null || objectiveId === '' || pathId == null || pathId === '') {
      return;
    }

    // Prevent multiple simultaneous calls
    if (isGeneratingRef.current && !isRetry) {
      return;
    }

    // Double-check that modules don't already exist
    if (path != null && Array.isArray(path.modules) && path.modules.length > 0) {
      return;
    }
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
        const errorMsg = res.error?.message ?? 'Failed to generate modules';
        setModuleGenerationError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      const errorMsg = error.message ?? 'Failed to generate modules';
      setModuleGenerationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setGeneratingModules(false);
      isGeneratingRef.current = false;
    }
  };

  // Helper function to load and process objective data
  const loadObjectiveData = async (
    objId: string,
    pId: string | undefined,
    isMountedRef: { current: boolean }
  ): Promise<void> => {
    const res = await apiService.getObjective(objId);
    if (!isMountedRef.current) {
      return;
    }

    const obj = res.data as unknown as LearningObjective;
    setObjective(obj);
    const learningPaths: LearningPath[] | undefined = obj.learningPaths;
    const p: LearningPath | null = findPathById(learningPaths, pId);
    setPath(p);
    setLoading(false);

    if (p == null) {
      return;
    }

    if (
      shouldAutoGenerateModules(
        isMountedRef.current,
        p,
        generationAttemptedRef.current,
        isGeneratingRef.current
      )
    ) {
      generationAttemptedRef.current = true;
      generateModules(false).catch((err: unknown): undefined => {
        console.error('Error generating modules:', err);
        return undefined;
      });
    }
  };

  useEffect((): (() => void) => {
    // Reset refs when objectiveId or pathId changes
    generationAttemptedRef.current = false;
    isGeneratingRef.current = false;
    setModuleGenerationError(null);
    let isMounted = true;

    const load = async (): Promise<void> => {
      try {
        if (objectiveId == null || objectiveId === '') {
          setLoading(false);
          return;
        }

        await loadObjectiveData(objectiveId, pathId, { current: isMounted });
      } catch (error: unknown) {
        if (isMounted) {
          setLoading(false);
          toast.error('Failed to load objective');
        }
      }
    };

    load().catch((err: unknown): undefined => {
      console.error('Error in load:', err);
      return undefined;
    });

    return (): void => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectiveId, pathId]);

  const handleStartModule = async (module: LearningModule): Promise<void> => {
    if (objectiveId == null || objectiveId === '' || pathId == null || pathId === '') {
      return;
    }

    try {
      setLoadingModule(module.id);

      // If module has no flashcards, generate flashcards and resources
      if (module.hasFlashcards !== true) {
        try {
          await generateModuleContentIfNeeded(
            objectiveId,
            pathId,
            module,
            setGeneratingContent,
            reloadData
          );
        } catch {
          setLoadingModule(null);
          return;
        }
      }

      // Rediriger vers la page d'apprentissage
      navigate(`/objectives/${objectiveId}/paths/${pathId}/modules/${module.id}/learn`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message ?? 'Failed to start module');
    } finally {
      setLoadingModule(null);
    }
  };

  const handleCompleteModule = async (module: LearningModule): Promise<void> => {
    if (objectiveId == null || objectiveId === '' || pathId == null || pathId === '') {
      return;
    }

    try {
      setLoadingModule(module.id);
      const res = await apiService.completeModule(objectiveId, pathId, module.id);
      if (res.success) {
        toast.success('Module marked as completed');
        await reloadData();
      } else {
        const errorMsg = res.error?.message ?? 'Failed to complete module';
        toast.error(errorMsg);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message ?? 'Failed to complete module');
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

  if (objective == null || path == null) {
    return (
      <div className="p-6">
        <div className="text-slate-600 text-sm mb-4">Path not found.</div>
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

  const handleBackToDashboard = (): void => {
    navigate('/dashboard');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PathHeader
        pathTitle={path.title}
        objectiveTitle={objective.title}
        difficulty={path.difficulty}
        estimatedDuration={path.estimatedDuration}
        skills={path.skills}
        onBackToDashboard={handleBackToDashboard}
      />

      <ModulesList
        modules={path.modules}
        generatingModules={generatingModules}
        moduleGenerationError={moduleGenerationError}
        generatingContent={generatingContent}
        loadingModule={loadingModule}
        pathProgress={path.progress}
        onRetryGenerate={async (): Promise<void> => {
          await generateModules(true);
        }}
        onStartModule={handleStartModule}
        onCompleteModule={handleCompleteModule}
      />

      <PathActions
        isCompleted={path.isCompleted}
        isEnabled={path.isEnabled}
        objectiveId={objectiveId}
        pathId={pathId}
        onStartPath={async (): Promise<void> => {
          if (path.isEnabled !== true) {
            toast.error('This path is locked. Complete previous paths first.');
            return;
          }
          const firstEnabledModule: LearningModule | undefined = path.modules.find(
            (m: LearningModule): boolean => m.isEnabled === true
          );
          if (firstEnabledModule != null) {
            await handleStartModule(firstEnabledModule);
          } else {
            toast('No enabled modules available', { icon: 'ℹ️' });
          }
        }}
        onCompletePath={async (): Promise<void> => {
          if (objectiveId == null || pathId == null) {
            return;
          }
          try {
            const res = await apiService.completeLearningPath(objectiveId, pathId);
            if (res.success) {
              toast.success('Path marked as completed');
              await reloadData();
            } else {
              const errorMsg = res.error?.message ?? 'Failed to complete path';
              toast.error(errorMsg);
            }
          } catch (e: unknown) {
            toast.error('Failed to complete path');
          }
        }}
      />

      <ContentGenerationModal
        isOpen={generatingContent != null}
        moduleTitle={
          generatingContent != null
            ? path.modules.find((m: LearningModule): boolean => m.id === generatingContent)
                ?.title ?? ''
            : ''
        }
        message="Génération du contenu d'apprentissage en cours..."
      />
    </div>
  );
};

export default ObjectivePathPage;
