import type React from 'react';
import { useState } from 'react';
import type { LearningPlan, SkillLevel } from '@/types';
import { XIcon } from './icons';

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (title: string, skillLevel: string, topic?: string) => void;
  plan: LearningPlan;
}

const EditPlanModal: React.FC<EditPlanModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  plan,
}): JSX.Element | null => {
  const [title, setTitle] = useState(plan.title);
  const [skillLevel, setSkillLevel] = useState(plan.skillLevel);
  const [topic, setTopic] = useState(plan.topic);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (title.trim() !== '') {
      onUpdate(title.trim(), skillLevel, topic.trim() !== '' ? topic.trim() : undefined);
      onClose();
    }
  };

  if (isOpen !== true) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Edit Learning Plan</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Plan Title</label>
            <input
              type="text"
              value={title}
              onChange={(e): void => {
                setTitle(e.target.value);
              }}
              placeholder="e.g., React Hooks, Machine Learning Basics"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Skill Level</label>
            <select
              value={skillLevel}
              onChange={(e): void => {
                setSkillLevel(e.target.value as SkillLevel);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e): void => {
                setTopic(e.target.value);
              }}
              placeholder="e.g., JavaScript, Python, History"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Update Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlanModal;
