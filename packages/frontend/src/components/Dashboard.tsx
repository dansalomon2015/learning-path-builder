import React from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';
import LearningObjectivesDashboard from './LearningObjectivesDashboard';

interface DashboardProps {
  plans?: any[];
  onStartStudy?: any;
  onCreatePlan?: any;
  onUpdatePlan?: any;
  onDeletePlan?: any;
}

const Dashboard: React.FC<DashboardProps> = () => {
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
