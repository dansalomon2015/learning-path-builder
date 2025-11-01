import type React from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';
import LearningObjectivesDashboard from './LearningObjectivesDashboard';

interface DashboardProps {
  plans?: unknown[];
  onStartStudy?: () => void;
  onCreatePlan?: () => void;
  onUpdatePlan?: () => void;
  onDeletePlan?: () => void;
}

const Dashboard: React.FC<DashboardProps> = (): JSX.Element => {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard className="mb-8" />

      {/* Learning Objectives Dashboard */}
      <LearningObjectivesDashboard className="mb-8" />
    </div>
  );
};

export default Dashboard;
