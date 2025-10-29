import React, { useState } from 'react';
import { XIcon, SparklesIcon, BookOpenIcon, FileTextIcon } from './icons';
import LearningPlanTemplates from './LearningPlanTemplates';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (planData: {
    title: string;
    description: string;
    topic: string;
    skillLevel: string;
    mode: string;
    cardCount?: number;
    generateFromDocument?: boolean;
  }) => void;
}

const CreatePlanModal: React.FC<CreatePlanModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [showTemplates, setShowTemplates] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [mode, setMode] = useState('mixed');
  const [cardCount, setCardCount] = useState(10);
  const [isFromDocument, setIsFromDocument] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTemplateSelect = (template: any) => {
    setTitle(template.title);
    setDescription(template.description);
    setTopic(template.topic);
    setSkillLevel(template.skillLevel);
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && topic.trim()) {
      setIsGenerating(true);
      try {
        await onCreate({
          title: title.trim(),
          description: description.trim() || `Plan d'apprentissage pour ${title.trim()}`,
          topic: topic.trim(),
          skillLevel,
          mode,
          cardCount,
          generateFromDocument: isFromDocument,
        });
        // Reset form
        setTitle('');
        setDescription('');
        setTopic('');
        setSkillLevel('beginner');
        setMode('mixed');
        setCardCount(10);
        setIsFromDocument(false);
        onClose();
      } catch (error) {
        console.error('Error creating learning plan:', error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-800">Create New Learning Plan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {showTemplates ? (
            <LearningPlanTemplates onSelectTemplate={handleTemplateSelect} />
          ) : (
            <>
              {/* Back to Templates Button */}
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowTemplates(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <span>←</span>
                  <span>Back to Templates</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTemplates(true)}
                  className="text-sm text-slate-600 hover:text-slate-800"
                >
                  Start Over
                </button>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                  <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                  <span>Basic Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Plan Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., React Hooks, Machine Learning Basics"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Topic *</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="e.g., JavaScript, Python, History"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what you want to learn..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Learning Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                  <SparklesIcon className="w-5 h-5 text-indigo-600" />
                  <span>Learning Configuration</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Skill Level
                    </label>
                    <select
                      value={skillLevel}
                      onChange={e => setSkillLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Study Mode
                    </label>
                    <select
                      value={mode}
                      onChange={e => setMode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="mixed">Mixed (Flashcards + Quiz)</option>
                      <option value="flashcards">Flashcards Only</option>
                      <option value="quiz">Quiz Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Card Count
                    </label>
                    <select
                      value={cardCount}
                      onChange={e => setCardCount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={5}>5 cards</option>
                      <option value={10}>10 cards</option>
                      <option value={15}>15 cards</option>
                      <option value={20}>20 cards</option>
                      <option value={25}>25 cards</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Generation Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
                  <FileTextIcon className="w-5 h-5 text-indigo-600" />
                  <span>AI Generation Options</span>
                </h3>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="fromDocument"
                      checked={isFromDocument}
                      onChange={e => setIsFromDocument(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="fromDocument" className="text-sm font-medium text-slate-700">
                      Generate from uploaded document
                    </label>
                  </div>
                  <p className="text-sm text-slate-600">
                    Upload a PDF or text document and let AI extract key concepts to create
                    flashcards automatically.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <SparklesIcon className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      AI-Powered Content Generation
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    Our AI will automatically generate {cardCount} high-quality flashcards and quiz
                    questions based on your topic and skill level.
                  </p>
                </div>
              </div>
            </>
          )}

          {!showTemplates && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || !title.trim() || !topic.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    <span>Create Plan</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreatePlanModal;
