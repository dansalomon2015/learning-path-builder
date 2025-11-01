import React, { useState, useEffect } from 'react';
import { User, LearningObjective } from '../types';
import { ArrowLeftIcon, BarChartIcon, UserIcon, AlertTriangleIcon } from './icons';
import { apiService } from '../services/api';

interface ProfilePageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteAccount: () => void;
  onBackToDashboard: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onUpdateUser,
  onDeleteAccount,
  onBackToDashboard,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadObjectives = async () => {
      try {
        const res = await apiService.getObjectives();
        setObjectives((res.data as any[]) || []);
      } catch (error) {
        console.error('Error loading objectives:', error);
      } finally {
        setLoading(false);
      }
    };
    loadObjectives();
  }, []);

  useEffect(() => {
    setEditedUser(user);
  }, [user]);

  const handleSave = () => {
    onUpdateUser(editedUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const handleDeleteConfirm = () => {
    onDeleteAccount();
    setShowDeleteConfirm(false);
  };

  // Calculate statistics from objectives
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter(obj => obj.status === 'completed').length;
  const inProgressObjectives = objectives.filter(obj => obj.status === 'in_progress').length;
  const averageProgress =
    objectives.length > 0
      ? Math.round(
          objectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / objectives.length
        )
      : 0;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
              <p className="text-slate-600">{user.email}</p>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={editedUser.name}
                    onChange={e => setEditedUser({ ...editedUser, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editedUser.email}
                    onChange={e => setEditedUser({ ...editedUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Future: Badges system could be displayed here */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics and Learning Objectives */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChartIcon className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-800">Learning Statistics</h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{totalObjectives}</p>
                  <p className="text-sm text-slate-600">Objectives</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{completedObjectives}</p>
                  <p className="text-sm text-slate-600">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{inProgressObjectives}</p>
                  <p className="text-sm text-slate-600">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-indigo-600">{averageProgress}%</p>
                  <p className="text-sm text-slate-600">Avg Progress</p>
                </div>
              </div>
            )}
          </div>

          {/* Learning Objectives */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Your Learning Objectives</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : objectives.length > 0 ? (
              <div className="space-y-3">
                {objectives.map(objective => (
                  <div key={objective.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-slate-800">{objective.title}</h4>
                      <span className="text-sm text-slate-500">{objective.progress || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-600">{objective.category}</span>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
                        {objective.status}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${objective.progress || 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {objective.learningPaths?.length || 0} learning paths
                      {objective.learningPaths?.filter((p: any) => p.isCompleted).length > 0 &&
                        ` • ${
                          objective.learningPaths?.filter((p: any) => p.isCompleted).length
                        } completed`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                No learning objectives yet. Create your first objective to start learning!
              </p>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangleIcon className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-bold text-red-600">Danger Zone</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-red-600">Delete Account</h2>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <AlertTriangleIcon className="w-6 h-6 text-red-500 mt-0.5" />
                <p className="text-slate-700">
                  Are you sure you want to delete your account? This action cannot be undone and
                  will permanently remove all your learning data.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
