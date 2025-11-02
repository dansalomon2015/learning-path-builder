import type React from 'react';
import { User, Mail, Calendar, BookOpen, Target } from 'lucide-react';

// Mock data - to be replaced with API calls
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: null,
  role: 'student',
  createdAt: '2024-01-15',
  learningPaths: [
    {
      id: '1',
      title: 'Learn React from A to Z',
      progress: 75,
      completedResources: 3,
      totalResources: 4,
    },
    {
      id: '2',
      title: 'Introduction to TypeScript',
      progress: 100,
      completedResources: 5,
      totalResources: 5,
    },
  ],
  stats: {
    totalLearningPaths: 2,
    completedPaths: 1,
    totalHours: 60,
    averageRating: 4.7,
  },
};

interface UserInfoProps {
  name: string;
  email: string;
  createdAt: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ name, email, createdAt }): JSX.Element => (
  <div className="card p-8">
    <div className="flex items-start space-x-6">
      <div className="flex-shrink-0">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
          <User className="h-10 w-10 text-primary-600" />
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{name}</h2>

        <div className="space-y-2 text-gray-600">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>{email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Member since {new Date(createdAt).toLocaleDateString('en-US')}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface StatsProps {
  stats: {
    totalLearningPaths: number;
    completedPaths: number;
    totalHours: number;
    averageRating: number;
  };
}

const Stats: React.FC<StatsProps> = ({ stats }): JSX.Element => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    <div className="card p-6 text-center">
      <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
        <BookOpen className="h-6 w-6 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{stats.totalLearningPaths}</h3>
      <p className="text-gray-600">Learning Paths</p>
    </div>

    <div className="card p-6 text-center">
      <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
        <Target className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{stats.completedPaths}</h3>
      <p className="text-gray-600">Completed Paths</p>
    </div>

    <div className="card p-6 text-center">
      <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
        <Calendar className="h-6 w-6 text-yellow-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{stats.totalHours}h</h3>
      <p className="text-gray-600">Learning Hours</p>
    </div>

    <div className="card p-6 text-center">
      <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
        <Target className="h-6 w-6 text-purple-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{stats.averageRating}</h3>
      <p className="text-gray-600">Average Rating</p>
    </div>
  </div>
);

interface LearningPath {
  id: string;
  title: string;
  progress: number;
  completedResources: number;
  totalResources: number;
}

interface LearningPathCardProps {
  path: LearningPath;
}

const LearningPathCard: React.FC<LearningPathCardProps> = ({ path }): JSX.Element => (
  <div className="border border-gray-200 rounded-lg p-6">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-xl font-semibold text-gray-900">{path.title}</h3>
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          path.progress === 100 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}
      >
        {path.progress === 100 ? 'Completed' : 'In Progress'}
      </span>
    </div>

    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm text-gray-500">
          {path.completedResources}/{path.totalResources} resources
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${path.progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-500 mt-1">{path.progress}% completed</p>
    </div>

    <button className="btn btn-primary">{path.progress === 100 ? 'Review' : 'Continue'}</button>
  </div>
);

export function ProfilePage(): JSX.Element {
  const user = mockUser;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">Manage your information and track your progress</p>
      </div>

      {/* User Info */}
      <UserInfo name={user.name} email={user.email} createdAt={user.createdAt} />

      {/* Stats */}
      <Stats stats={user.stats} />

      {/* Learning Paths */}
      <div className="card p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Learning Paths</h2>

        <div className="space-y-6">
          {user.learningPaths.map(
            (path): JSX.Element => (
              <LearningPathCard key={path.id} path={path} />
            )
          )}
        </div>

        {user.learningPaths.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No learning paths followed</p>
            <p className="text-gray-400">Start by exploring our learning paths</p>
          </div>
        )}
      </div>
    </div>
  );
}
