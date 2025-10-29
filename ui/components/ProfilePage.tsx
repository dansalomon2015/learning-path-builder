import React, { useState } from 'react';
import { User, LearningPlan } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import ConfirmationModal from './ConfirmationModal';
import { UserIcon } from './icons/UserIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface ProfilePageProps {
  user: User;
  plans: LearningPlan[];
  onUpdateUser: (updatedUser: User) => void;
  onDeleteAccount: () => void;
  onBackToDashboard: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, plans, onUpdateUser, onDeleteAccount, onBackToDashboard }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });

  const totalFlashcards = plans.reduce((acc, plan) => acc + plan.flashcards.length, 0);

  const handleEdit = () => {
    setFormData({ name: user.name, email: user.email });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    onUpdateUser({ ...user, ...formData });
    setIsEditing(false);
  };
  
  const handleAvatarChange = () => {
    // Simulate avatar change by picking a new random one
    const newAvatarUrl = `https://i.pravatar.cc/150?u=${Date.now()}`;
    onUpdateUser({ ...user, avatarUrl: newAvatarUrl });
  };

  const handleDeleteConfirm = () => {
    onDeleteAccount();
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button onClick={onBackToDashboard} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition-colors mb-6">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="relative">
                <img src={user.avatarUrl} alt="User avatar" className="w-20 h-20 rounded-full border-4 border-indigo-100" />
                 {isEditing && (
                    <button 
                        onClick={handleAvatarChange} 
                        className="absolute bottom-0 right-0 p-1 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition"
                        title="Change Avatar"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M7 9l4-4 4 4M4 14v5h5m-5-2.5l4-4 4 4" /></svg>
                    </button>
                )}
            </div>
            {isEditing ? (
              <div className="flex-grow">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-2xl font-bold text-slate-800 border-b-2 border-indigo-300 focus:border-indigo-500 outline-none transition"
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-slate-500 mt-1 border-b-2 border-indigo-300 focus:border-indigo-500 outline-none transition"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{user.name}</h1>
                <p className="text-slate-500">{user.email}</p>
              </div>
            )}
          </div>
          {isEditing ? (
            <div className="flex gap-2 mt-4 sm:mt-0">
              <button onClick={handleCancel} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">Save Changes</button>
            </div>
          ) : (
            <button onClick={handleEdit} className="mt-4 sm:mt-0 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors">Edit Profile</button>
          )}
        </div>

        <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BarChartIcon className="w-6 h-6 text-indigo-500" />
                Learning Statistics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-indigo-600">{plans.length}</p>
                    <p className="text-sm font-medium text-slate-600">Learning Plans</p>
                </div>
                 <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-indigo-600">{totalFlashcards}</p>
                    <p className="text-sm font-medium text-slate-600">Flashcards Mastered</p>
                </div>
                 <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-indigo-600">42h</p>
                    <p className="text-sm font-medium text-slate-600">Total Study Time</p>
                </div>
            </div>
        </div>

         <div>
            <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                <AlertTriangleIcon className="w-6 h-6 text-red-500" />
                Danger Zone
            </h2>
            <div className="bg-red-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-red-800">Delete Account</h3>
                    <p className="text-sm text-red-700">Permanently delete your account and all of your data.</p>
                </div>
                <button onClick={() => setIsDeleteModalOpen(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">Delete</button>
            </div>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Account"
        message="Are you sure you want to delete your account? All your learning plans will be permanently removed. This action cannot be undone."
      />
    </div>
  );
};

export default ProfilePage;
