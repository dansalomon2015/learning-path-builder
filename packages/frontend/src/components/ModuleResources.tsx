import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ExternalLink, CheckCircle2, BookOpen, Loader2, History } from 'lucide-react';
import { Badge } from './ui/badge';
import type { SuggestedResource } from '../types';
import { ResourceType } from '../types';
import { ResourceAssessmentModal } from './ResourceAssessmentModal';
import { ResourceAssessmentHistoryModal } from './ResourceAssessmentHistoryModal';
import { apiService } from '../services/api';
import type { ResourceAssessmentResult } from '../types';

interface ModuleResourcesProps {
  resources: SuggestedResource[];
  moduleId: string;
  objectiveId: string;
  onSelfAssess?: (resourceId: string) => void;
  onAssessmentComplete?: (resourceId: string) => void;
}

const getTypeLabel = (type: ResourceType): string => {
  switch (type) {
    case ResourceType.ARTICLE:
      return 'Article';
    case ResourceType.VIDEO:
      return 'Video';
    case ResourceType.DOCUMENTATION:
      return 'Documentation';
    case ResourceType.TUTORIAL:
      return 'Tutorial';
    case ResourceType.BOOK:
      return 'Book';
    case ResourceType.OFFICIAL_GUIDE:
      return 'Official Guide';
    default:
      return 'Resource';
  }
};

const getTypeColor = (type: ResourceType): string => {
  switch (type) {
    case ResourceType.ARTICLE:
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case ResourceType.VIDEO:
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case ResourceType.DOCUMENTATION:
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case ResourceType.TUTORIAL:
      return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case ResourceType.BOOK:
      return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    case ResourceType.OFFICIAL_GUIDE:
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export function ModuleResources({
  resources,
  moduleId,
  objectiveId,
  onSelfAssess,
  onAssessmentComplete,
}: ModuleResourcesProps): JSX.Element {
  const [selectedResource, setSelectedResource] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [historyResource, setHistoryResource] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [resourceStatuses, setResourceStatuses] = useState<
    Map<string, { isCompleted: boolean; lastScore?: number }>
  >(new Map());
  const [loadingStatuses, setLoadingStatuses] = useState<Set<string>>(new Set());

  // Load resource statuses on mount
  useEffect((): void => {
    const loadStatuses = async (): Promise<void> => {
      for (const resource of resources) {
        try {
          setLoadingStatuses((prev) => new Set(prev).add(resource.id));
          const response = await apiService.getResourceAssessmentStatus(resource.id);
          if (response.success && response.data != null) {
            const data = response.data;
            setResourceStatuses((prev) => {
              const newMap = new Map(prev);
              newMap.set(resource.id, {
                isCompleted: data.isCompleted,
                lastScore: data.lastScore,
              });
              return newMap;
            });
          }
        } catch (error: unknown) {
          // Silently fail - status is optional
          console.error('Error loading resource status:', error);
        } finally {
          setLoadingStatuses((prev) => {
            const newSet = new Set(prev);
            newSet.delete(resource.id);
            return newSet;
          });
        }
      }
    };
    if (resources.length > 0) {
      void loadStatuses();
    }
  }, [resources]);

  const handleSelfAssess = (resourceId: string, resourceTitle: string): void => {
    setSelectedResource({ id: resourceId, title: resourceTitle });
    if (onSelfAssess != null) {
      onSelfAssess(resourceId);
    }
  };

  const handleAssessmentComplete = (result: ResourceAssessmentResult): void => {
    // Update local status
    setResourceStatuses((prev) => {
      const newMap = new Map(prev);
      newMap.set(result.resourceId, {
        isCompleted: true,
        lastScore: result.score,
      });
      return newMap;
    });
    setSelectedResource(null);
    
    // Notify parent to re-evaluate final exam eligibility
    if (onAssessmentComplete != null) {
      onAssessmentComplete(result.resourceId);
    }
  };

  const handleCloseModal = (): void => {
    setSelectedResource(null);
  };

  const handleShowHistory = (resourceId: string, resourceTitle: string): void => {
    setHistoryResource({ id: resourceId, title: resourceTitle });
  };

  const handleCloseHistory = (): void => {
    setHistoryResource(null);
  };

  if (resources.length === 0) {
    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Suggested Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No resources available at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Ressources suggérées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.map((resource): JSX.Element => {
          const status = resourceStatuses.get(resource.id);
          const isAssessed = status?.isCompleted ?? false;
          const isLoadingStatus = loadingStatuses.has(resource.id);
          const lastScore = status?.lastScore;

          return (
            <div
              key={resource.id}
              className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getTypeColor(resource.type)}>
                      {getTypeLabel(resource.type)}
                    </Badge>
                    {isLoadingStatus && (
                      <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Loading...
                      </Badge>
                    )}
                    {isAssessed && !isLoadingStatus && (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-500 border-green-500/20"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Self-Assessed
                        {lastScore != null && ` - ${lastScore}%`}
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold leading-tight">{resource.title}</h4>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {resource.url != null && resource.url !== '' && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </a>
                  </Button>
                )}
                {isAssessed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(): void => handleShowHistory(resource.id, resource.title)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    History
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={(): void => handleSelfAssess(resource.id, resource.title)}
                  disabled={isLoadingStatus}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {isAssessed ? 'Retake Assessment' : 'Self-Assess'}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
      {selectedResource != null && (
        <ResourceAssessmentModal
          isOpen={true}
          resourceId={selectedResource.id}
          resourceTitle={selectedResource.title}
          moduleId={moduleId}
          objectiveId={objectiveId}
          onClose={handleCloseModal}
          onComplete={handleAssessmentComplete}
        />
      )}
      {historyResource != null && (
        <ResourceAssessmentHistoryModal
          isOpen={true}
          resourceId={historyResource.id}
          resourceTitle={historyResource.title}
          onClose={handleCloseHistory}
        />
      )}
    </Card>
  );
}
