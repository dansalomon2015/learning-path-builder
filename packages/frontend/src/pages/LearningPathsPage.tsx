import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Star, Search } from 'lucide-react';

// Mock data - to be replaced with API calls
const mockLearningPaths = [
  {
    id: '1',
    title: 'Learn React from A to Z',
    description: 'A complete path to master React, from basics to advanced concepts.',
    difficulty: 'intermediate',
    estimatedDuration: 40,
    topics: ['React', 'JavaScript', 'TypeScript'],
    rating: 4.8,
    studentsCount: 1250,
    isPublished: true,
  },
  {
    id: '2',
    title: 'Introduction to TypeScript',
    description: 'Discover TypeScript and its benefits for modern development.',
    difficulty: 'beginner',
    estimatedDuration: 20,
    topics: ['TypeScript', 'JavaScript'],
    rating: 4.6,
    studentsCount: 890,
    isPublished: true,
  },
  {
    id: '3',
    title: 'Microservices Architecture',
    description: 'Design and implement robust microservices architectures.',
    difficulty: 'advanced',
    estimatedDuration: 60,
    topics: ['Microservices', 'Docker', 'Kubernetes'],
    rating: 4.9,
    studentsCount: 450,
    isPublished: true,
  },
];

// eslint-disable-next-line max-lines-per-function
export function LearningPathsPage(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const filteredPaths = mockLearningPaths.filter((path): boolean => {
    const matchesSearch =
      path.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      path.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || path.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Learning Paths</h1>
        <p className="mt-2 text-gray-600">
          Discover and follow structured paths to develop your skills
        </p>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for a path..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => {
                  setSearchTerm(e.target.value);
                }}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="sm:w-48">
            <select
              value={difficultyFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>): void => {
                setDifficultyFilter(e.target.value);
              }}
              className="input"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Learning Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPaths.map(
          (path): JSX.Element => (
            <div key={path.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                    path.difficulty
                  )}`}
                >
                  {getDifficultyLabel(path.difficulty)}
                </span>
                <div className="flex items-center space-x-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{path.rating}</span>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">{path.title}</h3>

              <p className="text-gray-600 mb-4 line-clamp-3">{path.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {path.topics.map(
                  (topic: string): JSX.Element => (
                    <span
                      key={topic}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                    >
                      {topic}
                    </span>
                  )
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{path.estimatedDuration}h</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{path.studentsCount}</span>
                </div>
              </div>

              <Link to={`/learning-paths/${path.id}`} className="btn btn-primary w-full">
                View Path
              </Link>
            </div>
          )
        )}
      </div>

      {filteredPaths.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No paths found</p>
          <p className="text-gray-400">Try modifying your search criteria</p>
        </div>
      )}
    </div>
  );
}
