import type React from 'react';
import { useState, useEffect } from 'react';
import type { ResourceAssessmentResult } from '../types';
import { X, CheckCircle, XCircle, Clock, Trophy, Calendar, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

interface ResourceAssessmentHistoryModalProps {
  isOpen: boolean;
  resourceId: string;
  resourceTitle: string;
  onClose: () => void;
}

export const ResourceAssessmentHistoryModal: React.FC<ResourceAssessmentHistoryModalProps> = ({
  isOpen,
  resourceId,
  resourceTitle,
  onClose,
}): JSX.Element | null => {
  const [history, setHistory] = useState<ResourceAssessmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  useEffect((): void => {
    if (isOpen && resourceId !== '') {
      void loadHistory();
    }
  }, [isOpen, resourceId]);

  const loadHistory = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiService.getResourceAssessmentHistory(resourceId);
      if (response.success && response.data != null) {
        setHistory(response.data);
      } else {
        toast.error('Erreur lors du chargement de l\'historique');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}min ${secs}s`;
    }
    return `${secs}s`;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Historique des auto-évaluations</h2>
              <p className="text-sm text-slate-500 mt-1">{resourceTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-slate-600">Chargement de l'historique...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && history.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-600 mb-2">
                Aucun historique disponible
              </p>
              <p className="text-sm text-slate-500">
                Vous n'avez pas encore complété d'auto-évaluation pour cette ressource.
              </p>
            </div>
          )}

          {/* History list */}
          {!loading && history.length > 0 && (
            <div className="space-y-4">
              {history.map((result) => (
                <div
                  key={result.id}
                  className={`border rounded-lg p-4 transition-all ${
                    result.passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {/* Result header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {result.passed ? (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-2xl font-bold ${
                              result.passed ? 'text-green-700' : 'text-red-700'
                            }`}
                          >
                            {result.score}%
                          </span>
                          {result.passed && (
                            <Trophy className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {result.correctAnswers} / {result.totalQuestions} réponses correctes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(result.completedAt)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        {formatTime(result.timeSpent)}
                      </div>
                    </div>
                  </div>

                  {/* Expandable details */}
                  <button
                    onClick={(): void =>
                      setExpandedResult(expandedResult === result.id ? null : result.id)
                    }
                    className="w-full text-left text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    {expandedResult === result.id ? 'Masquer les détails' : 'Voir les détails'}
                  </button>

                  {/* Expanded details */}
                  {expandedResult === result.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                      {result.feedback.map((feedback, index) => (
                        <div
                          key={feedback.questionId}
                          className={`p-3 rounded-lg ${
                            feedback.correct
                              ? 'bg-green-100 border border-green-200'
                              : 'bg-red-100 border border-red-200'
                          }`}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            {feedback.correct ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-slate-800 mb-1">
                                Question {index + 1}: {feedback.question}
                              </p>
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="font-medium">Votre réponse:</span>{' '}
                                  <span
                                    className={
                                      feedback.correct ? 'text-green-700' : 'text-red-700'
                                    }
                                  >
                                    {String(feedback.userAnswer)}
                                  </span>
                                </p>
                                {!feedback.correct && (
                                  <p>
                                    <span className="font-medium">Bonne réponse:</span>{' '}
                                    <span className="text-green-700">
                                      {String(feedback.correctAnswer)}
                                    </span>
                                  </p>
                                )}
                                <p className="text-slate-600 mt-2">{feedback.explanation}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

