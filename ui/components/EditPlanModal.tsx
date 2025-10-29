import React, { useState, useEffect } from 'react';
import { LearningPlan } from '../types';

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (title: string, level: string) => void;
  plan: LearningPlan | null;
}

const EditPlanModal: React.FC<EditPlanModalProps> = ({ isOpen, onClose, onUpdate, plan }) => {
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState('Beginner');

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setLevel(plan.level);
    }
  }, [plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && plan) {
      onUpdate(title, level);
      onClose();
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md m-4 transform transition-all duration-300 scale-95 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Learning Plan</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title-edit" className="block text-sm font-medium text-slate-700 mb-1">
              Topic / Theme
            </label>
            <input
              type="text"
              id="title-edit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quantum Physics"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="level-edit" className="block text-sm font-medium text-slate-700 mb-1">
              Your Current Level
            </label>
            <select
              id="level-edit"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlanModal;
