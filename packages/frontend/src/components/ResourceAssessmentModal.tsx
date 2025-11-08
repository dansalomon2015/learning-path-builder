import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ResourceAssessment, ResourceAssessmentResult } from '../types';
import { X, Clock, CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiService } from '../services/api';

interface ResourceAssessmentModalProps {
  isOpen: boolean;
  resourceId: string;
  resourceTitle: string;
  moduleId: string;
  objectiveId: string;
  onClose: () => void;
  onComplete?: (result: ResourceAssessmentResult) => void;
}

interface QuizResultsProps {
  result: ResourceAssessmentResult;
  onClose: () => void;
  onRetry: () => void;
}

// eslint-disable-next-line max-lines-per-function
const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  onClose,
  onRetry,
}): JSX.Element => {
  const correctCount = result.feedback.filter((f): boolean => f.correct).length;
  const incorrectCount = result.feedback.filter((f): boolean => !f.correct).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Résultats de l&apos;auto-évaluation</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mb-8">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                result.passed ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {result.passed ? (
                <Trophy className="w-12 h-12 text-green-600" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600" />
              )}
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                result.passed ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {result.passed ? 'Congratulations!' : 'Retry'}
            </h3>
            <p className="text-lg text-slate-600 mb-4">
              You scored <span className="font-bold">{result.score}%</span>
            </p>
            <p className="text-sm text-slate-500">
              {result.passed
                ? 'You have validated your understanding of this resource!'
                : 'You need to score 70% to pass. Try again after reviewing the resource.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{correctCount}</p>
              <p className="text-sm text-green-600">Correct</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-700">{incorrectCount}</p>
              <p className="text-sm text-red-600">Incorrect</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-slate-800">Answer Details</h4>
            {result.feedback.map((feedback, index): JSX.Element => {
              return (
                <div
                  key={feedback.questionId}
                  className={`border rounded-lg p-4 ${
                    feedback.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {feedback.correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 mb-2">
                        Question {index + 1}: {feedback.question}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Your answer:</span>{' '}
                          <span className={feedback.correct ? 'text-green-700' : 'text-red-700'}>
                            {String(feedback.userAnswer)}
                          </span>
                        </p>
                        {!feedback.correct && (
                          <p>
                            <span className="font-medium">Correct answer:</span>{' '}
                            <span className="text-green-700">{String(feedback.correctAnswer)}</span>
                          </p>
                        )}
                        <p className="text-slate-600 mt-2">{feedback.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Quiz
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line max-lines-per-function
export const ResourceAssessmentModal: React.FC<ResourceAssessmentModalProps> = ({
  isOpen,
  resourceId,
  resourceTitle,
  moduleId,
  objectiveId,
  onClose,
  onComplete,
}): JSX.Element | null => {
  const [assessment, setAssessment] = useState<ResourceAssessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  const [startTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ResourceAssessmentResult | null>(null);
  const hasGeneratedRef = useRef<boolean>(false);

  // Reset state when modal closes or resource changes
  useEffect((): void => {
    if (!isOpen) {
      setAssessment(null);
      setCurrentQuestionIndex(0);
      setAnswers(new Map());
      setTimeSpent(0);
      setResult(null);
      setGenerating(false);
      setSubmitting(false);
      hasGeneratedRef.current = false;
    }
  }, [isOpen, resourceId]);

  // Timer effect
  useEffect((): (() => void) | undefined => {
    if (isOpen && assessment != null && !submitting && result == null) {
      const interval = setInterval((): void => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return (): void => {
        clearInterval(interval);
      };
    }
    return undefined;
  }, [isOpen, assessment, submitting, result, startTime]);

  const generateAssessment = useCallback(async (): Promise<void> => {
    setGenerating(true);
    try {
      const response = await apiService.startResourceAssessment(
        resourceId,
        moduleId,
        objectiveId,
        5, // Default 5 questions
        false // Don't force new
      );
      if (response.success && response.data != null) {
        setAssessment(response.data);
        setCurrentQuestionIndex(0);
        setAnswers(new Map());
        setTimeSpent(0);
        setResult(null);
      } else {
        const errorMessage = response.error?.message ?? 'Failed to generate assessment';
        toast.error(errorMessage);
        if (!errorMessage.includes('attendre')) {
          onClose();
        }
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; data?: { error?: { message?: string } } };
      };
      const errorMessage =
        err.response?.data?.error?.message ??
        (error instanceof Error ? error.message : 'Failed to generate assessment');

      // Check if it's a 429 (Too Many Requests) - cooldown
      if (err.response?.status === 429 || errorMessage.includes('attendre')) {
        toast.error(errorMessage, { duration: 5000 });
      } else {
        toast.error(errorMessage);
        onClose();
      }
    } finally {
      setGenerating(false);
    }
  }, [resourceId, moduleId, objectiveId, onClose]);

  // Generate assessment when modal opens (only once per resource)
  useEffect((): undefined => {
    if (isOpen && assessment == null && !generating && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      generateAssessment().catch((error: unknown): void => {
        console.error('Error generating assessment:', error);
      });
    }
    return undefined;
  }, [isOpen, resourceId, moduleId, objectiveId, assessment, generating, generateAssessment]);

  const handleAnswerSelect = (questionId: string, answer: string | number): void => {
    setAnswers((prev: Map<string, string | number>): Map<string, string | number> => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  };

  const handleNext = (): void => {
    if (assessment != null && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (assessment == null) {
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = Array.from(answers.entries()).map(([questionId, selectedAnswer]): { questionId: string; selectedAnswer: string | number } => ({
        questionId,
        selectedAnswer,
      }));

      const response = await apiService.submitResourceAssessment(
        assessment.id,
        answersArray,
        timeSpent
      );

      if (response.success && response.data != null) {
        setResult(response.data);
        if (onComplete != null) {
          onComplete(response.data);
        }
      } else {
        const errorMessage = response.error?.message ?? 'Failed to submit assessment';
        toast.error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to submit assessment';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = (): void => {
    setAssessment(null);
    setCurrentQuestionIndex(0);
    setAnswers(new Map());
    setTimeSpent(0);
    setResult(null);
    hasGeneratedRef.current = false;
    generateAssessment().catch((error: unknown): void => {
      console.error('Error generating assessment:', error);
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    return null;
  }

  // Show results
  if (result != null && assessment != null) {
    return (
      <QuizResults
        result={result}
        onClose={onClose}
        onRetry={handleRetry}
      />
    );
  }

  // Show loading state
  if (generating || assessment == null) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-8 shadow-xl">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-lg font-medium text-slate-800">
              Generating quiz...
            </p>
            <p className="text-sm text-slate-500 text-center">
              We are preparing personalized questions to validate your understanding of{' '}
              <span className="font-medium">{resourceTitle}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const selectedAnswer = answers.get(currentQuestion.id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Self-Assessment</h2>
              <p className="text-sm text-slate-500 mt-1">{resourceTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </span>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                {formatTime(timeSpent)}
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {currentQuestion.question}
            </h3>
            <div className="space-y-2">
              {currentQuestion.options.map((option: string, index: number): JSX.Element => {
                const isSelected = selectedAnswer === index || selectedAnswer === option;
                return (
                  <button
                    key={index}
                    onClick={(): void => handleAnswerSelect(currentQuestion.id, index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {currentQuestionIndex === assessment.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedAnswer == null}
                className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={selectedAnswer == null}
                className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

