import React, { useState, useRef, useEffect } from 'react';
import { LearningPlan, User } from '@/types';
import CreatePlanModal from './CreatePlanModal';
import EditPlanModal from './EditPlanModal';
import ConfirmationModal from './ConfirmationModal';
import {
  PlusIcon,
  BookOpenIcon,
  SearchIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
} from './icons';

interface DashboardProps {
  user: User;
  plans: LearningPlan[];
  onStartStudy: (plan: LearningPlan, mode: 'flashcards' | 'quiz') => void;
  onCreatePlan: (planData: {
    title: string;
    description: string;
    topic: string;
    skillLevel: string;
    mode: string;
    cardCount?: number;
    generateFromDocument?: boolean;
  }) => void;
  onUpdatePlan: (planId: string, data: Partial<LearningPlan>) => void;
  onDeletePlan: (planId: string) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteAccount: () => void;
  onBackToDashboard: () => void;
}

interface PlanCardProps {
  plan: LearningPlan;
  onStartStudy: (plan: LearningPlan, mode: 'flashcards' | 'quiz') => void;
  onEdit: (plan: LearningPlan) => void;
  onDelete: (plan: LearningPlan) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onStartStudy, onEdit, onDelete }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const masteryPercentage =
    plan.totalCards > 0 ? Math.round((plan.masteredCards / plan.totalCards) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <BookOpenIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 truncate pr-2">{plan.title}</h2>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(plan)}
              className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-full"
              aria-label={`Edit ${plan.title}`}
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(plan)}
              className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full"
              aria-label={`Delete ${plan.title}`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <span className="inline-block bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          {plan.skillLevel}
        </span>
        <p className="text-sm text-slate-500 mb-2">{plan.totalCards} flashcards</p>
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Progress</span>
            <span>{masteryPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${masteryPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      <div className="relative mt-4" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-2 flex justify-center items-center gap-2 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-colors"
        >
          Study
          <ChevronDownIcon
            className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isDropdownOpen && (
          <div className="absolute bottom-full mb-2 w-full bg-white rounded-lg shadow-xl border border-slate-100 animate-fade-in p-2 z-10">
            <button
              onClick={() => {
                onStartStudy(plan, 'flashcards');
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 rounded-md transition-colors"
            >
              Spaced Repetition
            </button>
            <button
              onClick={() => {
                onStartStudy(plan, 'quiz');
                setIsDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-slate-700 hover:bg-indigo-50 rounded-md transition-colors"
            >
              Quiz Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({
  user,
  plans,
  onStartStudy,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onUpdateUser,
  onDeleteAccount,
  onBackToDashboard,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<LearningPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<LearningPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlans = plans.filter(
    plan =>
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateAndClose = (title: string, skillLevel: string, topic?: string) => {
    if (planToEdit) {
      onUpdatePlan(planToEdit.id, { title, skillLevel, topic });
    }
    setPlanToEdit(null);
  };

  const handleDeleteConfirm = () => {
    if (planToDelete) {
      onDeletePlan(planToDelete.id);
    }
    setPlanToDelete(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Learning Plans</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-transform transform hover:scale-105 shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          Create New Plan
        </button>
      </div>

      <div className="mb-8">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search plans by title or topic..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            aria-label="Search learning plans"
          />
        </div>
      </div>

      {filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onStartStudy={onStartStudy}
              onEdit={setPlanToEdit}
              onDelete={setPlanToDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          {searchQuery ? (
            <>
              <h2 className="text-xl font-semibold text-slate-700">No Results Found</h2>
              <p className="text-slate-500 mt-2">
                No learning plans match your search. Try different keywords.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-700">No learning plans yet.</h2>
              <p className="text-slate-500 mt-2 mb-6">
                Click "Create New Plan" to start your learning journey!
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 mx-auto px-5 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-transform transform hover:scale-105 shadow-md"
              >
                <PlusIcon className="w-5 h-5" />
                Create New Plan
              </button>
            </>
          )}
        </div>
      )}

      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={onCreatePlan}
      />
      {planToEdit && (
        <EditPlanModal
          isOpen={!!planToEdit}
          onClose={() => setPlanToEdit(null)}
          onUpdate={handleUpdateAndClose}
          plan={planToEdit}
        />
      )}
      {planToDelete && (
        <ConfirmationModal
          isOpen={!!planToDelete}
          onClose={() => setPlanToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Learning Plan"
          message={`Are you sure you want to delete the "${planToDelete.title}" plan? This action cannot be undone.`}
        />
      )}
    </div>
  );
};

export default Dashboard;
