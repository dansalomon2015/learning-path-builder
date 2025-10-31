import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LearningObjective, Assessment, AssessmentResult } from '../types';
import CreateObjectiveModal from './CreateObjectiveModal';
import SkillAssessment from './SkillAssessment';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';
import {
  PlusIcon,
  TargetIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  PlayIcon,
  CheckCircleIcon,
  CalendarIcon,
  TrendingUpIcon,
  LightBulbIcon,
} from './icons';
import { TrashIcon } from './icons';

interface LearningObjectivesDashboardProps {
  className?: string;
}

interface ObjectiveCardProps {
  objective: LearningObjective;
  onStartAssessment: (objectiveId: string) => void;
  onViewDetails: (objectiveId: string) => void;
  onStartLearning: (objectiveId: string) => void;
  onDelete: (objectiveId: string) => void;
  isStarting?: boolean;
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  onStartAssessment,
  onViewDetails,
  onStartLearning,
  onDelete,
  isStarting = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'completed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const completedMilestones = objective.milestones.filter(m => m.isCompleted).length;
  const totalMilestones = objective.milestones.length;
  const hasPaths = (objective.learningPaths && objective.learningPaths.length > 0) || false;
  const completedPaths = objective.learningPaths.filter(p => p.isCompleted).length;
  const avgPathProgress =
    objective.learningPaths.length > 0
      ? Math.round(
          objective.learningPaths.reduce((sum, p) => sum + (p.progress || 0), 0) /
            objective.learningPaths.length
        )
      : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <TargetIcon className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-800">{objective.title}</h3>
          </div>
          <p className="text-slate-600 text-sm mb-3">{objective.description}</p>
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <span className="flex items-center space-x-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{objective.targetTimeline} months</span>
            </span>
            <span className="flex items-center space-x-1">
              <TrophyIcon className="w-4 h-4" />
              <span>{objective.targetRole}</span>
            </span>
            {(objective as any).lastAssessment && (
              <span className="flex items-center space-x-1">
                <ChartBarIcon className="w-4 h-4" />
                <span>
                  {(objective as any).lastAssessment.score}% ·{' '}
                  {(objective as any).lastAssessment.skillLevel}
                </span>
              </span>
            )}
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
            objective.status
          )}`}
        >
          {objective.status.replace('_', ' ')}
        </div>
        <button
          onClick={() => onDelete(objective.id)}
          className="ml-3 text-slate-400 hover:text-red-600 cursor-pointer"
          title="Delete objective"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Overall Progress</span>
          <span className="text-sm font-semibold text-slate-800">{objective.progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(
              objective.progress
            )}`}
            style={{ width: `${objective.progress}%` }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Milestones</span>
          <span className="text-sm font-semibold text-slate-800">
            {completedMilestones}/{totalMilestones}
          </span>
        </div>
        <div className="flex space-x-1">
          {objective.milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`h-2 flex-1 rounded ${
                milestone.isCompleted ? 'bg-green-500' : 'bg-slate-200'
              }`}
              title={milestone.title}
            />
          ))}
        </div>
      </div>

      {/* Learning Paths */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Learning Paths</span>
          <span className="text-sm font-semibold text-slate-800">
            {objective.learningPaths.filter(p => p.isCompleted).length}/
            {objective.learningPaths.length}
          </span>
        </div>
        <div className="space-y-2">
          {objective.learningPaths.slice(0, 2).map(path => (
            <div key={path.id} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 truncate">{path.title}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-slate-200 rounded-full h-1">
                  <div
                    className="bg-indigo-500 h-1 rounded-full"
                    style={{ width: `${path.progress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">{path.progress}%</span>
              </div>
            </div>
          ))}
          {objective.learningPaths.length > 2 && (
            <p className="text-xs text-slate-500">
              +{objective.learningPaths.length - 2} more paths
            </p>
          )}
        </div>
      </div>

      {/* Objective Stats & Analytics (compact) */}
      {hasPaths && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-indigo-600">
              {objective.learningPaths.length}
            </div>
            <div className="text-xs text-slate-600">Paths</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-600">{completedPaths}</div>
            <div className="text-xs text-slate-600">Completed</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-600">{avgPathProgress}%</div>
            <div className="text-xs text-slate-600">Avg Progress</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {objective.status === 'planning' && !hasPaths && (
          <button
            onClick={() => onStartAssessment(objective.id)}
            disabled={isStarting}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isStarting
                ? 'bg-indigo-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isStarting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                <span>Preparing assessment…</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                <span>Start Assessment</span>
              </>
            )}
          </button>
        )}

        {/* If learning paths exist, show jump-to-objective and continue learning */}
        {hasPaths && (
          <>
            <button
              onClick={() => onViewDetails(objective.id)}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              <span>Go to Objective</span>
            </button>
            <button
              onClick={() => onStartLearning(objective.id)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Continue Learning
            </button>
          </>
        )}

        {objective.status === 'in_progress' && !hasPaths && (
          <>
            <button
              onClick={() => onStartLearning(objective.id)}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              <PlayIcon className="w-4 h-4" />
              <span>Continue Learning</span>
            </button>
            <button
              onClick={() => onViewDetails(objective.id)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Details
            </button>
          </>
        )}

        {objective.status === 'completed' && (
          <button
            onClick={() => onViewDetails(objective.id)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>View Certificate</span>
          </button>
        )}

        {objective.status === 'paused' && (
          <button
            onClick={() => onStartLearning(objective.id)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-colors"
          >
            <PlayIcon className="w-4 h-4" />
            <span>Resume</span>
          </button>
        )}
      </div>
    </div>
  );
};

const LearningObjectivesDashboard: React.FC<LearningObjectivesDashboardProps> = ({
  className = '',
}) => {
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [startingObjectiveId, setStartingObjectiveId] = useState<string | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<LearningObjective | null>(null);
  const navigate = useNavigate();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState<string>('');
  const [setupLoading, setSetupLoading] = useState(false);

  const fetchObjectives = async () => {
    try {
      const res = await apiService.getObjectives();
      setObjectives(res.data as any[] as LearningObjective[]);
    } catch (e) {
      console.error('Failed to load objectives', e);
    } finally {
      setLoading(false);
    }
  };

  // Load objectives from backend
  useEffect(() => {
    fetchObjectives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartAssessment = async (objectiveId: string) => {
    try {
      setStartingObjectiveId(objectiveId);
      const res = await apiService.startAssessment({ objectiveId });
      if (res.success && res.data) {
        setActiveAssessment(res.data as Assessment);
        setShowAssessment(true);
        toast.success('Assessment started');
      } else {
        toast.error(res?.error?.message || 'Failed to start assessment');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to start assessment';
      toast.error(msg);
      console.error('Start assessment failed', e);
    } finally {
      setStartingObjectiveId(null);
    }
  };

  const handleSubmitAssessmentResult = async (
    assessmentId: string,
    answers: { questionId: string; selectedAnswer: number }[],
    timeSpent: number
  ) => {
    try {
      const res = await apiService.submitAssessment(assessmentId, answers, timeSpent);
      if (res.success && res.data) {
        toast.success('Assessment completed!');
        console.log('Assessment result:', res.data);
        // TODO: Update objective progress based on result
      } else {
        toast.error(res?.error?.message || 'Failed to submit assessment');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to submit assessment';
      toast.error(msg);
      console.error('Submit assessment failed', e);
    }
  };

  const handleBackFromAssessment = () => {
    setShowAssessment(false);
    setActiveAssessment(null);
    // Refresh objectives to reflect newly generated learning paths
    setLoading(true);
    fetchObjectives();
  };

  // Setup learning path (generate paths + modules) with loading modal
  const setupLearningPath = async (objectiveId: string) => {
    console.log('setupLearningPath called with objectiveId:', objectiveId);
    try {
      setShowAssessment(false);
      setSetupLoading(true);
      console.log('Calling generateLearningPaths API...');
      const pathsRes = await apiService.generateLearningPaths(objectiveId);
      console.log('generateLearningPaths response:', pathsRes);

      if (!pathsRes.success) {
        const errorMsg = pathsRes?.error?.message || pathsRes?.message || 'Paths generation failed';
        console.error('Paths generation failed:', errorMsg);
        throw new Error(errorMsg);
      }

      const paths = (pathsRes.data as any[]) || [];
      console.log('Generated paths:', paths);
      const first = paths[0];

      if (first) {
        console.log('Generating modules for first path:', first.id);
        try {
          await apiService.generatePathModules(objectiveId, first.id);
        } catch (moduleError) {
          console.warn('Module generation failed (non-critical):', moduleError);
        }
        console.log('Navigating to path:', `/objectives/${objectiveId}/paths/${first.id}`);
        navigate(`/objectives/${objectiveId}/paths/${first.id}`);
      } else {
        console.error('No paths in response');
        toast.error('No path generated');
      }
    } catch (e: any) {
      console.error('setupLearningPath error:', e);
      console.error('Error stack:', e?.stack);
      const msg =
        e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        e?.message ||
        'Failed to set up learning path';
      toast.error(msg);
    } finally {
      setSetupLoading(false);
    }
  };

  const handleViewDetails = (objectiveId: string) => {
    const obj = objectives.find(o => o.id === objectiveId) || null;
    setSelectedObjective(obj);
  };

  const handleStartLearning = (objectiveId: string) => {
    const obj = objectives.find(o => o.id === objectiveId) || null;
    setSelectedObjective(obj);
  };

  const handleCreateObjective = () => {
    setShowCreateModal(true);
  };

  const openDeleteConfirm = (objectiveId: string) => {
    const obj = objectives.find(o => o.id === objectiveId);
    setConfirmDeleteId(objectiveId);
    setConfirmDeleteTitle(obj?.title || 'this objective');
  };

  const closeDeleteConfirm = () => {
    setConfirmDeleteId(null);
    setConfirmDeleteTitle('');
  };

  const confirmDeleteObjective = async () => {
    if (!confirmDeleteId) return;
    try {
      const res = await apiService.deleteObjective(confirmDeleteId);
      if (res.success) {
        setObjectives(prev => prev.filter(o => o.id !== confirmDeleteId));
        toast.success('Objective deleted');
      } else {
        toast.error(res?.error?.message || 'Failed to delete objective');
      }
    } catch (e) {
      toast.error('Failed to delete objective');
    } finally {
      closeDeleteConfirm();
    }
  };

  const handleCreateObjectiveSubmit = async (objectiveData: {
    title: string;
    description: string;
    category: string;
    targetRole: string;
    targetTimeline: number;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }): Promise<boolean> => {
    try {
      const res = await apiService.createObjective(objectiveData);
      if (res.success && res.data) {
        setObjectives(prev => [res.data as any, ...prev]);
        toast.success('Objective created');
        return true;
      } else {
        toast.error(res?.error?.message || 'Failed to create objective');
        return false;
      }
    } catch (e: any) {
      console.error('Create objective failed', e);
      const msg = e?.response?.data?.message || 'Failed to create objective';
      toast.error(msg);
      return false;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show assessment if active
  if (showAssessment && activeAssessment) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <SkillAssessment
          assessment={activeAssessment}
          onComplete={result => {
            console.log('Assessment completed:', result);
            // The SkillAssessment component will handle the backend submission internally
          }}
          onSubmitResult={handleSubmitAssessmentResult}
          onBack={handleBackFromAssessment}
          onSetupLearningPath={(objectiveId: string) => setupLearningPath(objectiveId)}
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      {/* Objective Details Modal */}
      {selectedObjective && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedObjective.title}</h3>
                <p className="text-slate-600 text-sm">{selectedObjective.description}</p>
              </div>
              <button
                onClick={() => setSelectedObjective(null)}
                className="px-3 py-1 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-indigo-600">
                  {selectedObjective.learningPaths.length}
                </div>
                <div className="text-xs text-slate-600">Paths</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">
                  {selectedObjective.learningPaths.filter(p => p.isCompleted).length}
                </div>
                <div className="text-xs text-slate-600">Completed</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">
                  {selectedObjective.learningPaths.length > 0
                    ? Math.round(
                        selectedObjective.learningPaths.reduce((s, p) => s + (p.progress || 0), 0) /
                          selectedObjective.learningPaths.length
                      )
                    : 0}
                  %
                </div>
                <div className="text-xs text-slate-600">Avg Progress</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Learning Paths</h4>
              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {selectedObjective.learningPaths.map(path => (
                  <div
                    key={path.id}
                    className="flex items-center justify-between border border-slate-200 rounded-lg p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{path.title}</div>
                      <div className="text-xs text-slate-500">{path.description}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-20 bg-slate-200 rounded-full h-1">
                        <div
                          className="bg-indigo-500 h-1 rounded-full"
                          style={{ width: `${path.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{path.progress}%</span>
                      <button
                        onClick={() =>
                          navigate(`/objectives/${selectedObjective.id}/paths/${path.id}`)
                        }
                        className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
                {selectedObjective.learningPaths.length === 0 && (
                  <div className="text-sm text-slate-500">No learning paths yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Starting Assessment Modal */}
      {startingObjectiveId && !showAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-3">
              <span className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <h3 className="text-lg font-semibold text-slate-800">Preparing your assessment…</h3>
            </div>
            <p className="text-sm text-slate-600">
              We’re generating tailored questions based on your objective. This can take up to a
              minute. Please wait.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Learning Objectives</h2>
          <p className="text-slate-600 mt-1">Set goals and track your learning journey</p>
        </div>
        <button
          onClick={handleCreateObjective}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Objective</span>
        </button>
      </div>

      {objectives.length === 0 ? (
        <div className="text-center py-12">
          <TargetIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No objectives yet</h3>
          <p className="text-slate-500 mb-6">Create your first learning objective to get started</p>
          <button
            onClick={handleCreateObjective}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Create Your First Objective
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {objectives.map(objective => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              onStartAssessment={handleStartAssessment}
              onViewDetails={handleViewDetails}
              onStartLearning={handleStartLearning}
              onDelete={openDeleteConfirm}
              isStarting={startingObjectiveId === objective.id}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {objectives.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{objectives.length}</div>
              <div className="text-sm text-slate-600">Total Objectives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {objectives.filter(o => o.status === 'in_progress').length}
              </div>
              <div className="text-sm text-slate-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {objectives.filter(o => o.status === 'completed').length}
              </div>
              <div className="text-sm text-slate-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)}
                %
              </div>
              <div className="text-sm text-slate-600">Avg Progress</div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete objective</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{confirmDeleteTitle}</span>? This will also remove
              related assessments and results. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeDeleteConfirm}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteObjective}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Loading Modal */}
      {setupLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-2">
              <span className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <h3 className="text-lg font-bold text-slate-800">Setting up your learning path…</h3>
            </div>
            <p className="text-sm text-slate-600">
              We are generating your paths and modules based on your assessment. This may take a
              moment.
            </p>
          </div>
        </div>
      )}

      {/* Create Objective Modal */}
      <CreateObjectiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateObjectiveSubmit}
      />
    </div>
  );
};

export default LearningObjectivesDashboard;
