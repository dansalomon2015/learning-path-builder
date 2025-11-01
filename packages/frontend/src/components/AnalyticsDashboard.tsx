import type React from 'react';
import { useState, useEffect } from 'react';
import { sessionService } from '../services/sessionService';
import type { SessionStats } from '../services/sessionService';
import {
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  TrendingUpIcon,
  CalendarIcon,
  TargetIcon,
  LightBulbIcon,
} from './icons';

interface AnalyticsDashboardProps {
  className?: string;
}

// eslint-disable-next-line max-lines-per-function
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }): JSX.Element => {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect((): void => {
    const loadStats = (): void => {
      try {
        const sessionStats = sessionService.getSessionStats();
        setStats(sessionStats);
      } catch (error: unknown) {
        console.error('Error loading session stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_unused: unknown, i: number): JSX.Element => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stats == null) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Study Analytics</h3>
        <div className="text-center py-8">
          <ChartBarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No study data available yet</p>
          <p className="text-sm text-slate-500 mt-2">Start studying to see your progress!</p>
        </div>
      </div>
    );
  }

  const recommendations = sessionService.getAdaptiveRecommendations();

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">Study Analytics</h3>
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <CalendarIcon className="w-4 h-4" />
          <span>
            Last updated:{' '}
            {stats.lastStudyDate != null && stats.lastStudyDate !== ''
              ? formatDate(stats.lastStudyDate)
              : 'Never'}
          </span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="w-6 h-6 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              Sessions
            </span>
          </div>
          <p className="text-2xl font-bold text-indigo-800">{stats.totalSessions}</p>
          <p className="text-xs text-indigo-600">Total completed</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <ClockIcon className="w-6 h-6 text-green-600" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Study Time
            </span>
          </div>
          <p className="text-2xl font-bold text-green-800">{formatTime(stats.totalStudyTime)}</p>
          <p className="text-xs text-green-600">Total time spent</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrophyIcon className="w-6 h-6 text-yellow-600" />
            <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
              Streak
            </span>
          </div>
          <p className="text-2xl font-bold text-yellow-800">{stats.currentStreak}</p>
          <p className="text-xs text-yellow-600">Current streak (days)</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUpIcon className="w-6 h-6 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
              Accuracy
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-800">{stats.accuracyRate}%</p>
          <p className="text-xs text-purple-600">Overall accuracy</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Performance Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Cards Mastered</span>
              <span className="text-sm font-semibold text-slate-800">{stats.cardsMastered}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Average Session</span>
              <span className="text-sm font-semibold text-slate-800">
                {formatTime(stats.averageSessionLength)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Favorite Mode</span>
              <span className="text-sm font-semibold text-slate-800 capitalize">
                {stats.favoriteMode}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Longest Streak</span>
              <span className="text-sm font-semibold text-slate-800">
                {stats.longestStreak} days
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">AI Recommendations</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <TargetIcon className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600">Difficulty</p>
                <p className="text-sm text-slate-800 capitalize">
                  {recommendations.difficultyAdjustment} difficulty
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600">Suggested Mode</p>
                <p className="text-sm text-slate-800 capitalize">{recommendations.suggestedMode}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LightBulbIcon className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold text-slate-600">Time to Mastery</p>
                <p className="text-sm text-slate-800">
                  {recommendations.estimatedTimeToMastery} days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Insights */}
      {stats.totalSessions > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <LightBulbIcon className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-semibold text-slate-700">Progress Insights</h4>
          </div>
          <div className="text-sm text-slate-600 space-y-1">
            {stats.accuracyRate >= 80 && (
              <p>🎯 Great job! Your accuracy is excellent. Consider increasing difficulty.</p>
            )}
            {stats.currentStreak >= 7 && (
              <p>🔥 Amazing streak! You&apos;re building a strong learning habit.</p>
            )}
            {stats.averageSessionLength < 10 && (
              <p>⏱️ Try longer study sessions for better retention.</p>
            )}
            {stats.totalSessions >= 10 && stats.accuracyRate < 70 && (
              <p>📚 Consider reviewing easier cards to build confidence.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
