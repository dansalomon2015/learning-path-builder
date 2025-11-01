import type React from 'react';
import type { SuggestedResource } from '../types';
import {
  BookOpen,
  FileText,
  Video,
  GraduationCap,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface SuggestedResourcesPanelProps {
  resources: SuggestedResource[];
}

// eslint-disable-next-line max-lines-per-function
const SuggestedResourcesPanel: React.FC<SuggestedResourcesPanelProps> = ({
  resources,
}): JSX.Element => {
  if (resources.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Suggested Resources</h3>
        <p className="text-xs text-slate-500">No resources available yet.</p>
      </div>
    );
  }

  // Sort by priority (1 = high priority)
  const sortedResources = [...resources].sort(
    (a: SuggestedResource, b: SuggestedResource): number => a.priority - b.priority
  );

  // Grouper par priority
  const highPriority = sortedResources.filter((r: SuggestedResource): boolean => r.priority <= 2);
  const recommended = sortedResources.filter((r: SuggestedResource): boolean => r.priority === 3);
  const optional = sortedResources.filter((r: SuggestedResource): boolean => r.priority >= 4);

  const getResourceIcon = (type: SuggestedResource['type']): JSX.Element => {
    switch (type) {
      case 'documentation':
        return <FileText className="w-4 h-4" />;
      case 'book':
        return <BookOpen className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'tutorial':
      case 'official_guide':
        return <GraduationCap className="w-4 h-4" />;
      case 'article':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: number): string => {
    if (priority <= 2) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    if (priority === 3) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const _getPriorityLabel = (priority: number): string => {
    if (priority <= 2) {
      return 'High Priority';
    }
    if (priority === 3) {
      return 'Recommended';
    }
    return 'Optional';
  };

  const renderResourceGroup = (
    group: SuggestedResource[],
    label: string,
    colorClass: string
  ): JSX.Element | null => {
    if (group.length === 0) {
      return null;
    }

    return (
      <div className="mb-4">
        <div
          className={`flex items-center space-x-2 mb-2 px-2 py-1 rounded-md border ${colorClass}`}
        >
          {label === 'High Priority' && <AlertCircle className="w-3 h-3" />}
          <h4 className="text-xs font-semibold">{label}</h4>
        </div>
        <div className="space-y-2">
          {group.map(
            (resource: SuggestedResource): JSX.Element => (
              <div
                key={resource.id}
                className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-2 mb-2">
                  <div className="mt-0.5 text-slate-400">{getResourceIcon(resource.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-slate-800 line-clamp-2">
                      {resource.title}
                    </h5>
                    {resource.author != null && resource.author !== '' && (
                      <p className="text-xs text-slate-500 mt-0.5">by {resource.author}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-2 line-clamp-2">{resource.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs ${
                        resource.difficulty === 'beginner'
                          ? 'bg-green-100 text-green-700'
                          : resource.difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {resource.difficulty}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{resource.estimatedTime} min</span>
                    </div>
                  </div>
                  {resource.url != null && resource.url !== '' && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 h-fit">
      <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center space-x-2">
        <BookOpen className="w-4 h-4" />
        <span>Suggested Resources</span>
      </h3>
      <div className="space-y-4">
        {renderResourceGroup(highPriority, 'High Priority', getPriorityColor(1))}
        {renderResourceGroup(recommended, 'Recommended', getPriorityColor(3))}
        {renderResourceGroup(optional, 'Optional', getPriorityColor(5))}
      </div>
    </div>
  );
};

export default SuggestedResourcesPanel;
