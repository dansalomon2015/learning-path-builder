import type React from 'react';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { ObjectiveAnalytics } from '../types';
import {
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  TrendingUpIcon,
  CalendarIcon,
  TargetIcon,
  LightBulbIcon,
  BookOpenIcon,
} from './icons';

interface ObjectiveAnalyticsDashboardProps {
  objectiveId: string;
  className?: string;
}

// eslint-disable-next-line max-lines-per-function
const ObjectiveAnalyticsDashboard: React.FC<ObjectiveAnalyticsDashboardProps> = ({
  objectiveId,
  className = '',
}): JSX.Element => {
  const [analytics, setAnalytics] = useState<ObjectiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect((): void => {
    const loadAnalytics = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getObjectiveAnalytics(objectiveId, timeRange);
        if (response.success && response.data != null) {
          setAnalytics(response.data);
        } else {
          setError('Failed to load analytics');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading objective analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (objectiveId !== '') {
      loadAnalytics().catch((err: unknown): void => {
        console.error('Error loading analytics:', err);
      });
    }
  }, [objectiveId, timeRange]);

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
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from(
              { length: 4 },
              (_unused: unknown, i: number): JSX.Element => (
                <div key={i} className="h-24 bg-slate-200 rounded-lg" />
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error != null || analytics == null) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Objective Analytics</h3>
        <div className="text-center py-8">
          <ChartBarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">
            {error != null ? `Error: ${error}` : 'No analytics data available'}
          </p>
          <p className="text-sm text-slate-500 mt-2">Start studying to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Objective Analytics</h3>
          <p className="text-sm text-slate-600 mt-1">{analytics.objectiveTitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e): void => setTimeRange(e.target.value as 'week' | 'month' | 'all')}
            className="text-sm border border-slate-300 rounded-md px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <ClockIcon className="w-6 h-6 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              Study Time
            </span>
          </div>
          <p className="text-2xl font-bold text-indigo-800">
            {formatTime(analytics.totalStudyTime)}
          </p>
          <p className="text-xs text-indigo-600">Total time spent</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrophyIcon className="w-6 h-6 text-green-600" />
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Mastery
            </span>
          </div>
          <p className="text-2xl font-bold text-green-800">{analytics.masteryLevel}%</p>
          <p className="text-xs text-green-600">Overall mastery</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUpIcon className="w-6 h-6 text-yellow-600" />
            <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
              Score
            </span>
          </div>
          <p className="text-2xl font-bold text-yellow-800">{analytics.averageScore}%</p>
          <p className="text-xs text-yellow-600">Average score</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <BookOpenIcon className="w-6 h-6 text-purple-600" />
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
              Progress
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-800">{analytics.completionRate}%</p>
          <p className="text-xs text-purple-600">Completion rate</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Objective Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Learning Paths</span>
              <span className="text-sm font-semibold text-slate-800">
                {analytics.learningPathsCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Modules</span>
              <span className="text-sm font-semibold text-slate-800">{analytics.modulesCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Study Sessions</span>
              <span className="text-sm font-semibold text-slate-800">
                {analytics.sessionsCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Learning Velocity</span>
              <span className="text-sm font-semibold text-slate-800">
                {analytics.learningVelocity.toFixed(1)} cards/hr
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Retention Rate</span>
              <span className="text-sm font-semibold text-slate-800">
                {analytics.retentionRate}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">AI Recommendations</h4>
          <div className="space-y-2">
            {analytics.recommendations.length > 0 ? (
              analytics.recommendations.slice(0, 5).map(
                (recommendation: string, index: number): JSX.Element => (
                  <div key={index} className="flex items-start space-x-2">
                    <LightBulbIcon className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{recommendation}</p>
                  </div>
                )
              )
            ) : (
              <p className="text-sm text-slate-500">No recommendations available yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Weak and Strong Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {analytics.weakAreas.length > 0 && (
          <div className="bg-red-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center">
              <TargetIcon className="w-4 h-4 mr-2" />
              Areas to Improve
            </h4>
            <div className="space-y-1">
              {analytics.weakAreas.map(
                (area: string, index: number): JSX.Element => (
                  <span
                    key={index}
                    className="inline-block bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full mr-2 mb-2"
                  >
                    {area}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {analytics.strongAreas.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
              <TrophyIcon className="w-4 h-4 mr-2" />
              Strong Areas
            </h4>
            <div className="space-y-1">
              {analytics.strongAreas.map(
                (area: string, index: number): JSX.Element => (
                  <span
                    key={index}
                    className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full mr-2 mb-2"
                  >
                    {area}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Timeline */}
      {analytics.progressTimeline.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Progress Timeline (Last 30 Days)
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {analytics.progressTimeline
              .filter(
                (entry: { date: string; studyTime: number; score: number }): boolean =>
                  entry.studyTime > 0 || entry.score > 0
              )
              .slice(-10)
              .map(
                (
                  entry: { date: string; studyTime: number; score: number },
                  index: number
                ): JSX.Element => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{formatDate(entry.date)}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-slate-700">{formatTime(entry.studyTime)} studied</span>
                      {entry.score > 0 && (
                        <span className="text-slate-700">Score: {entry.score}%</span>
                      )}
                    </div>
                  </div>
                )
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectiveAnalyticsDashboard;
