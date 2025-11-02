import { useParams } from 'react-router-dom';
import { Clock, Users, Star, Play, CheckCircle } from 'lucide-react';

// Mock data - to be replaced with API calls
const mockLearningPath = {
  id: '1',
  title: 'Learn React from A to Z',
  description:
    'A complete path to master React, from basics to advanced concepts. This path will guide you through all essential aspects of React, from components to advanced hooks.',
  difficulty: 'intermediate',
  estimatedDuration: 40,
  topics: ['React', 'JavaScript', 'TypeScript', 'JSX', 'Hooks'],
  rating: 4.8,
  studentsCount: 1250,
  isPublished: true,
  resources: [
    {
      id: '1',
      title: 'Introduction to React',
      type: 'video',
      duration: 45,
      description: 'Discover the fundamental concepts of React',
      completed: true,
    },
    {
      id: '2',
      title: 'Components and Props',
      type: 'article',
      duration: 30,
      description: 'Learn to create and use components',
      completed: true,
    },
    {
      id: '3',
      title: 'State and Lifecycle',
      type: 'video',
      duration: 60,
      description: 'Master state management in React',
      completed: false,
    },
    {
      id: '4',
      title: 'Hooks in Detail',
      type: 'course',
      duration: 90,
      description: 'Explore modern React hooks',
      completed: false,
    },
  ],
};

// eslint-disable-next-line max-lines-per-function
export function LearningPathDetailPage(): JSX.Element {
  const { id: _id } = useParams<{ id: string }>();

  // In reality, we would make an API call with the id
  const learningPath = mockLearningPath;

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner':
        return 'Beginner';
      case 'intermediate':
        return 'Intermediate';
      case 'advanced':
        return 'Advanced';
      default:
        return difficulty;
    }
  };

  const getResourceTypeIcon = (type: string): string => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'article':
        return '📄';
      case 'course':
        return '🎓';
      case 'book':
        return '📚';
      case 'tutorial':
        return '🔧';
      default:
        return '📝';
    }
  };

  const completedResources = learningPath.resources.filter(
    (r): boolean => r.completed === true
  ).length;
  const progressPercentage = (completedResources / learningPath.resources.length) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                  learningPath.difficulty
                )}`}
              >
                {getDifficultyLabel(learningPath.difficulty)}
              </span>
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-medium">{learningPath.rating}</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{learningPath.title}</h1>

            <p className="text-lg text-gray-600 mb-6">{learningPath.description}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {learningPath.topics.map(
                (topic: string): JSX.Element => (
                  <span
                    key={topic}
                    className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                  >
                    {topic}
                  </span>
                )
              )}
            </div>

            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>{learningPath.estimatedDuration}h</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>{learningPath.studentsCount} learners</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {completedResources}/{learningPath.resources.length} resources
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">{Math.round(progressPercentage)}% completed</p>
        </div>

        <button className="btn btn-primary btn-lg">
          <Play className="mr-2 h-5 w-5" />
          Continue Path
        </button>
      </div>

      {/* Resources */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Path Resources</h2>

        <div className="space-y-4">
          {learningPath.resources.map(
            (resource, index: number): JSX.Element => (
              <div
                key={resource.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  resource.completed === true
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-primary-200'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        resource.completed === true
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {resource.completed === true ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getResourceTypeIcon(resource.type)}</span>
                      <h3
                        className={`text-lg font-semibold ${
                          resource.completed === true ? 'text-green-800' : 'text-gray-900'
                        }`}
                      >
                        {resource.title}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {resource.type}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{resource.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{resource.duration} min</span>
                      </div>

                      <button
                        className={`btn btn-sm ${
                          resource.completed === true ? 'btn-secondary' : 'btn-primary'
                        }`}
                      >
                        {resource.completed === true ? 'Review' : 'Start'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
