import type React from 'react';
import { useState } from 'react';
import { XIcon, TargetIcon, CalendarIcon, TrophyIcon } from './icons';

interface CreateObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (objectiveData: {
    title: string;
    description: string;
    category: string;
    targetRole: string;
    targetTimeline: number;
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
    targetLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }) => Promise<boolean> | boolean;
}

// eslint-disable-next-line max-lines-per-function
const CreateObjectiveModal: React.FC<CreateObjectiveModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}): JSX.Element | null => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    targetRole: '',
    targetTimeline: 6,
    currentLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    targetLevel: 'advanced' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
  });

  const [isCreating, setIsCreating] = useState(false);

  const categories = [
    'Programming',
    'Design',
    'Data Science',
    'Marketing',
    'Management',
    'Sales',
    'Finance',
    'Healthcare',
    'Education',
    'Other',
  ];

  const popularRoles = {
    Programming: [
      'Frontend Developer',
      'Backend Developer',
      'Full Stack Developer',
      'Mobile Developer',
      'DevOps Engineer',
      'Data Engineer',
      'Machine Learning Engineer',
      'Software Architect',
    ],
    Design: [
      'UI/UX Designer',
      'Graphic Designer',
      'Product Designer',
      'Web Designer',
      'Motion Designer',
      'Design System Designer',
    ],
    'Data Science': [
      'Data Scientist',
      'Data Analyst',
      'Business Intelligence Analyst',
      'Machine Learning Engineer',
      'Data Engineer',
    ],
    Marketing: [
      'Digital Marketing Specialist',
      'Content Marketing Manager',
      'SEO Specialist',
      'Social Media Manager',
      'Marketing Manager',
    ],
    Management: [
      'Project Manager',
      'Product Manager',
      'Engineering Manager',
      'Team Lead',
      'Scrum Master',
    ],
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (
      formData.title === '' ||
      formData.description === '' ||
      formData.category === '' ||
      formData.targetRole === ''
    ) {
      return;
    }

    setIsCreating(true);
    try {
      const created = await onCreate(formData);
      if (created === true) {
        handleClose();
      }
    } catch (error: unknown) {
      console.error('Error creating objective:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = (): void => {
    setFormData({
      title: '',
      description: '',
      category: '',
      targetRole: '',
      targetTimeline: 6,
      currentLevel: 'beginner',
      targetLevel: 'advanced',
    });
    onClose();
  };

  const handleCategoryChange = (category: string): void => {
    setFormData((prev): typeof formData => ({
      ...prev,
      category,
      targetRole: '', // Reset target role when category changes
    }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <TargetIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">Create Learning Objective</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Objective Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e): void => {
                  setFormData((prev): typeof formData => ({ ...prev, title: e.target.value }));
                }}
                placeholder="e.g., Become Senior Java Developer"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e): void => {
                  setFormData((prev): typeof formData => ({
                    ...prev,
                    description: e.target.value,
                  }));
                }}
                placeholder="Describe what you want to achieve and why it's important to you..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                required
              />
            </div>
          </div>

          {/* Category and Role */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Career Focus</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e): void => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              >
                <option value="">Select a category</option>
                {categories.map(
                  (category: string): JSX.Element => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  )
                )}
              </select>
            </div>

            {formData.category !== '' && formData.category in popularRoles && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Role *
                </label>
                <select
                  value={formData.targetRole}
                  onChange={(e): void => {
                    setFormData((prev): typeof formData => ({
                      ...prev,
                      targetRole: e.target.value,
                    }));
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                >
                  <option value="">Select a role</option>
                  {popularRoles[formData.category as keyof typeof popularRoles].map(
                    (role: string): JSX.Element => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {formData.category !== '' && !(formData.category in popularRoles) && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Role *
                </label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={(e): void => {
                    setFormData((prev): typeof formData => ({
                      ...prev,
                      targetRole: e.target.value,
                    }));
                  }}
                  placeholder="Enter your target role"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  required
                />
              </div>
            )}
          </div>

          {/* Timeline and Levels */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Learning Plan</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Target Timeline (months)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={formData.targetTimeline}
                  onChange={(e): void => {
                    setFormData((prev): typeof formData => ({
                      ...prev,
                      targetTimeline: parseInt(e.target.value, 10),
                    }));
                  }}
                  className="flex-1"
                />
                <div className="flex items-center space-x-2 text-slate-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="font-semibold">{formData.targetTimeline} months</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Current Level
                </label>
                <select
                  value={formData.currentLevel}
                  onChange={(e): void => {
                    const value = e.target.value;
                    if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
                      setFormData((prev): typeof formData => ({ ...prev, currentLevel: value }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Level
                </label>
                <select
                  value={formData.targetLevel}
                  onChange={(e): void => {
                    const value = e.target.value;
                    if (
                      value === 'beginner' ||
                      value === 'intermediate' ||
                      value === 'advanced' ||
                      value === 'expert'
                    ) {
                      setFormData((prev): typeof formData => ({ ...prev, targetLevel: value }));
                    }
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
          </div>

          {/* AI-Powered Suggestions */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrophyIcon className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-semibold text-indigo-800">AI-Powered Learning Path</h4>
            </div>
            <p className="text-sm text-indigo-700">
              Once you create this objective, our AI will generate a personalized learning path
              with:
            </p>
            <ul className="text-sm text-indigo-700 mt-2 space-y-1">
              <li>• Skill assessment to evaluate your current level</li>
              <li>• Structured learning modules tailored to your timeline</li>
              <li>• Milestones and progress tracking</li>
              <li>• Practice projects and real-world applications</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isCreating === true ||
                formData.title === '' ||
                formData.description === '' ||
                formData.category === '' ||
                formData.targetRole === ''
              }
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <TargetIcon className="w-4 h-4" />
                  <span>Create Objective</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateObjectiveModal;
