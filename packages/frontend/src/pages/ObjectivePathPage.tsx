import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { LearningObjective, LearningPath } from '../types';
import { toast } from 'react-hot-toast';

const ObjectivePathPage: React.FC = () => {
  const { objectiveId, pathId } = useParams<{ objectiveId: string; pathId: string }>();
  const navigate = useNavigate();
  const [objective, setObjective] = useState<LearningObjective | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!objectiveId) return;
        const res = await apiService.getObjective(objectiveId);
        const obj = res.data as any as LearningObjective;
        setObjective(obj);
        const p = obj?.learningPaths?.find(lp => lp.id === pathId) || null;
        setPath(p);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [objectiveId, pathId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!objective || !path) {
    return (
      <div className="p-6">
        <div className="text-slate-600 text-sm mb-4">Path not found.</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{path.title}</h1>
          <p className="text-slate-600">{objective.title}</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="mb-4 text-sm text-slate-600">
        <span className="font-semibold">Difficulty:</span> {path.difficulty}
        <span className="mx-2">•</span>
        <span className="font-semibold">Estimated:</span> {path.estimatedDuration} weeks
        <span className="mx-2">•</span>
        <span className="font-semibold">Skills:</span> {path.skills.join(', ')}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Modules</h2>
        {path.modules.length === 0 ? (
          <div className="text-sm text-slate-500 mb-3">No modules yet.</div>
        ) : (
          <ul className="space-y-3">
            {path.modules.map(m => (
              <li key={m.id} className="border border-slate-200 rounded-lg p-4">
                <div className="text-sm font-semibold text-slate-800">{m.title}</div>
                <div className="text-xs text-slate-600">{m.description}</div>
                {'dueDate' in (m as any) && (
                  <div className="text-xs text-slate-500 mt-1">
                    Due: {(m as any).dueDate?.slice(0, 10)}
                  </div>
                )}
                <div className="mt-2 flex items-center space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700">
                    {m.isCompleted ? 'Resume' : 'Start'}
                  </button>
                  <button className="px-3 py-1 border border-slate-300 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50">
                    {m.isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <button
            onClick={async () => {
              try {
                const res = await apiService.generatePathModules(objectiveId!, pathId!);
                if (res.success) {
                  toast.success('Modules generated');
                  // reload
                  const r = await apiService.getObjective(objectiveId!);
                  const obj = r.data as any as LearningObjective;
                  setObjective(obj);
                  const p = obj?.learningPaths?.find(lp => lp.id === pathId) || null;
                  setPath(p);
                } else {
                  toast.error(res?.error?.message || 'Failed to generate modules');
                }
              } catch (e) {
                toast.error('Failed to generate modules');
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
          >
            Generate Modules
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
          Start Path
        </button>
        <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50">
          Mark as Completed
        </button>
      </div>
    </div>
  );
};

export default ObjectivePathPage;
