import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  LightBulbIcon,
  TrendingUpIcon,
  BookOpenIcon,
} from './icons';

interface AnalyticsData {
  analytics: {
    totalStudyTime: number;
    averageScore: number;
    masteryLevel: number;
    weakAreas: string[];
    strongAreas: string[];
    learningVelocity: number;
    retentionRate: number;
    recommendations: string[];
  };
  patterns: {
    preferredTimeOfDay: string;
    averageSessionLength: number;
    mostEffectiveMode: 'flashcards' | 'quiz' | 'mixed';
    difficultyProgression: number;
  };
}

interface AnalyticsDashboardProps {
  userId: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ userId }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [userId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/analytics/dashboard/${userId}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Erreur lors du chargement des analyses');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const getTimeOfDayEmoji = (timeOfDay: string): string => {
    switch (timeOfDay) {
      case 'morning':
        return '🌅';
      case 'afternoon':
        return '☀️';
      case 'evening':
        return '🌆';
      case 'night':
        return '🌙';
      default:
        return '📅';
    }
  };

  const getModeEmoji = (mode: string): string => {
    switch (mode) {
      case 'flashcards':
        return '🃏';
      case 'quiz':
        return '❓';
      case 'mixed':
        return '🔄';
      default:
        return '📚';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune donnée disponible</h3>
        <p className="mt-1 text-sm text-gray-500">
          Commencez à étudier pour voir vos analyses personnalisées.
        </p>
      </div>
    );
  }

  const { analytics, patterns } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analyses d'Apprentissage</h2>
          <p className="text-gray-600">Vos performances et recommandations personnalisées</p>
        </div>
        <div className="flex space-x-2">
          {(['week', 'month', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'week' ? '7 jours' : range === 'month' ? '30 jours' : 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Temps d'étude</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(analytics.totalStudyTime)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Score moyen</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUpIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Maîtrise</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.masteryLevel}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BookOpenIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vitesse</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.learningVelocity}/h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Study Patterns */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vos Habitudes d'Étude</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">{getTimeOfDayEmoji(patterns.preferredTimeOfDay)}</div>
            <p className="text-sm text-gray-600">Moment préféré</p>
            <p className="font-medium capitalize">{patterns.preferredTimeOfDay}</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">⏱️</div>
            <p className="text-sm text-gray-600">Durée moyenne</p>
            <p className="font-medium">{patterns.averageSessionLength} min</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">{getModeEmoji(patterns.mostEffectiveMode)}</div>
            <p className="text-sm text-gray-600">Mode efficace</p>
            <p className="font-medium capitalize">{patterns.mostEffectiveMode}</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <p className="text-sm text-gray-600">Progression</p>
            <p className="font-medium">
              {patterns.difficultyProgression > 0 ? '+' : ''}
              {patterns.difficultyProgression.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Weak and Strong Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Zones à Améliorer</h3>
          {analytics.weakAreas.length > 0 ? (
            <div className="space-y-2">
              {analytics.weakAreas.map((area, index) => (
                <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">{area}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucune zone faible identifiée ! 🎉</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Points Forts</h3>
          {analytics.strongAreas.length > 0 ? (
            <div className="space-y-2">
              {analytics.strongAreas.map((area, index) => (
                <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">{area}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Continuez à étudier pour identifier vos points forts !</p>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <LightBulbIcon className="h-6 w-6 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Recommandations IA</h3>
        </div>
        <div className="space-y-3">
          {analytics.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
              </div>
              <p className="text-gray-700">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
