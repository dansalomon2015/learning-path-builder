import React, { useState } from 'react';
import { User, LearningPlan } from '@/types';
import { ArrowLeftIcon, BarChartIcon, UserIcon, AlertTriangleIcon } from './icons';

interface ProfilePageProps {
  user: User;
  plans: LearningPlan[];
  onUpdateUser: (updatedUser: User) => void;
  onDeleteAccount: () => void;
  onBackToDashboard: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  plans,
  onUpdateUser,
  onDeleteAccount,
  onBackToDashboard,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

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

  // Calculate statistics
  const totalCards = plans.reduce((sum, plan) => sum + plan.totalCards, 0);
  const masteredCards = plans.reduce((sum, plan) => sum + plan.masteredCards, 0);
  const masteryPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Skill Level
                  </label>
                  <select
                    value={editedUser.skillLevel}
                    onChange={e =>
                      setEditedUser({
                        ...editedUser,
                        skillLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Skill Level
                  </label>
                  <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                    {user.skillLevel}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Learning Objectives
                  </label>
                  <p className="text-slate-600 text-sm">
                    {user.learningObjectives.length > 0
                      ? user.learningObjectives.join(', ')
                      : 'No objectives set yet'}
                  </p>
                </div>
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

        {/* Statistics and Learning Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChartIcon className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-800">Learning Statistics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{plans.length}</p>
                <p className="text-sm text-slate-600">Learning Plans</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{totalCards}</p>
                <p className="text-sm text-slate-600">Total Cards</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{masteredCards}</p>
                <p className="text-sm text-slate-600">Mastered Cards</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{masteryPercentage}%</p>
                <p className="text-sm text-slate-600">Mastery Rate</p>
              </div>
            </div>
          </div>

          {/* Learning Plans */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Your Learning Plans</h3>
            {plans.length > 0 ? (
              <div className="space-y-3">
                {plans.map(plan => {
                  const planMasteryPercentage =
                    plan.totalCards > 0
                      ? Math.round((plan.masteredCards / plan.totalCards) * 100)
                      : 0;

                  return (
                    <div key={plan.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-800">{plan.title}</h4>
                        <span className="text-sm text-slate-500">{planMasteryPercentage}%</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">{plan.topic}</span>
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
                          {plan.skillLevel}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${planMasteryPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {plan.masteredCards} / {plan.totalCards} cards mastered
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                No learning plans yet. Create your first plan to start learning!
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
