import React, { useState, useEffect } from 'react';
import { LearningObjective, Assessment, AssessmentResult } from '../types';
import CreateObjectiveModal from './CreateObjectiveModal';
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

interface LearningObjectivesDashboardProps {
  className?: string;
}

interface ObjectiveCardProps {
  objective: LearningObjective;
  onStartAssessment: (objectiveId: string) => void;
  onViewDetails: (objectiveId: string) => void;
  onStartLearning: (objectiveId: string) => void;
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  onStartAssessment,
  onViewDetails,
  onStartLearning,
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
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
            objective.status
          )}`}
        >
          {objective.status.replace('_', ' ')}
        </div>
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

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {objective.status === 'planning' && (
          <button
            onClick={() => onStartAssessment(objective.id)}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <PlayIcon className="w-4 h-4" />
            <span>Start Assessment</span>
          </button>
        )}

        {objective.status === 'in_progress' && (
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

  // Mock data for demonstration
  useEffect(() => {
    const mockObjectives: LearningObjective[] = [
      {
        id: 'obj-1',
        userId: 'user-1',
        title: 'Become Senior Java Developer',
        description:
          'Master advanced Java concepts, Spring Framework, microservices, and system design to become a senior-level Java developer.',
        category: 'Programming',
        targetRole: 'Senior Java Developer',
        targetTimeline: 6,
        currentLevel: 'intermediate',
        targetLevel: 'expert',
        status: 'in_progress',
        progress: 35,
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z',
        milestones: [
          {
            id: 'mil-1',
            title: 'Core Java Mastery',
            description: 'Complete advanced Java concepts and OOP principles',
            targetDate: '2024-02-15',
            completedDate: '2024-02-10',
            isCompleted: true,
            skills: ['Java', 'OOP', 'Collections'],
            learningPaths: ['path-1'],
          },
          {
            id: 'mil-2',
            title: 'Spring Framework',
            description: 'Learn Spring Boot, Spring Security, and Spring Data',
            targetDate: '2024-03-15',
            isCompleted: false,
            skills: ['Spring Boot', 'Spring Security', 'Spring Data'],
            learningPaths: ['path-2'],
          },
          {
            id: 'mil-3',
            title: 'Microservices Architecture',
            description: 'Design and implement microservices with Spring Cloud',
            targetDate: '2024-04-15',
            isCompleted: false,
            skills: ['Microservices', 'Spring Cloud', 'Docker'],
            learningPaths: ['path-3'],
          },
        ],
        learningPaths: [
          {
            id: 'path-1',
            objectiveId: 'obj-1',
            title: 'Advanced Java Fundamentals',
            description: 'Deep dive into Java 8+ features, concurrency, and performance',
            category: 'Programming',
            difficulty: 'intermediate',
            estimatedDuration: 4,
            prerequisites: ['Basic Java knowledge'],
            skills: ['Java 8+', 'Concurrency', 'Performance'],
            modules: [],
            isCompleted: true,
            progress: 100,
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-02-10T00:00:00Z',
          },
          {
            id: 'path-2',
            objectiveId: 'obj-1',
            title: 'Spring Boot Mastery',
            description: 'Build RESTful APIs and web applications with Spring Boot',
            category: 'Programming',
            difficulty: 'intermediate',
            estimatedDuration: 6,
            prerequisites: ['Java fundamentals'],
            skills: ['Spring Boot', 'REST APIs', 'JPA'],
            modules: [],
            isCompleted: false,
            progress: 25,
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-20T00:00:00Z',
          },
        ],
      },
      {
        id: 'obj-2',
        userId: 'user-1',
        title: 'Master React Development',
        description:
          'Become proficient in React, Redux, and modern frontend development practices.',
        category: 'Frontend Development',
        targetRole: 'Senior React Developer',
        targetTimeline: 4,
        currentLevel: 'beginner',
        targetLevel: 'advanced',
        status: 'planning',
        progress: 0,
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z',
        milestones: [],
        learningPaths: [],
      },
    ];

    setTimeout(() => {
      setObjectives(mockObjectives);
      setLoading(false);
    }, 1000);
  }, []);

  const handleStartAssessment = (objectiveId: string) => {
    console.log('Starting assessment for objective:', objectiveId);
    // TODO: Navigate to assessment page
  };

  const handleViewDetails = (objectiveId: string) => {
    console.log('Viewing details for objective:', objectiveId);
    // TODO: Navigate to objective details page
  };

  const handleStartLearning = (objectiveId: string) => {
    console.log('Starting learning for objective:', objectiveId);
    // TODO: Navigate to learning path
  };

  const handleCreateObjective = () => {
    setShowCreateModal(true);
  };

  const handleCreateObjectiveSubmit = async (objectiveData: {
    title: string;
    description: string;
    category: string;
    targetRole: string;
    targetTimeline: number;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }) => {
    // TODO: Create objective via API
    console.log('Creating objective:', objectiveData);

    // For now, add to local state
    const newObjective: LearningObjective = {
      id: `obj-${Date.now()}`,
      userId: 'user-1',
      title: objectiveData.title,
      description: objectiveData.description,
      category: objectiveData.category,
      targetRole: objectiveData.targetRole,
      targetTimeline: objectiveData.targetTimeline,
      currentLevel: objectiveData.currentLevel,
      targetLevel: objectiveData.targetLevel,
      status: 'planning',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      milestones: [],
      learningPaths: [],
    };

    setObjectives(prev => [newObjective, ...prev]);
    setShowCreateModal(false);
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

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
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
