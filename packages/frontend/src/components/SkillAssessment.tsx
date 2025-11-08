import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Assessment, AssessmentQuestion, AssessmentAnswer } from '../types';
import { AssessmentQuestionType, Difficulty } from '../types';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, ClockIcon, LightBulbIcon, TrophyIcon } from './icons';

interface SkillAssessmentProps {
  assessment: Assessment;
  onComplete: (result: AssessmentResult) => void;
  onBack: () => void;
  onSubmitResult?: (
    assessmentId: string,
    answers: { questionId: string; selectedAnswer: number }[],
    timeSpentMinutes: number
  ) => Promise<void> | void;
  onSetupLearningPath?: (objectiveId: string) => Promise<void> | void;
}

interface AssessmentResult {
  id: string;
  userId: string;
  assessmentId: string;
  objectiveId?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  answers: AssessmentAnswer[];
  completedAt: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  recommendations: string[];
}

interface QuestionCardProps {
  question: AssessmentQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string | number) => void;
  selectedAnswer?: string | number;
  timeRemaining?: number;
}

// eslint-disable-next-line max-lines-per-function
const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  selectedAnswer,
  timeRemaining,
}): JSX.Element => {
  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case Difficulty.EASY:
        return 'bg-green-100 text-green-700';
      case Difficulty.MEDIUM:
        return 'bg-yellow-100 text-yellow-700';
      case Difficulty.HARD:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (seconds: number | undefined): string => {
    if (seconds == null || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-600">Question</span>
            <span className="text-lg font-bold text-slate-800">
              {questionNumber} of {totalQuestions}
            </span>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
              question.difficulty
            )}`}
          >
            {question.difficulty}
          </div>
        </div>
        {timeRemaining !== undefined && (
          <div className="flex items-center space-x-2 text-slate-600">
            <ClockIcon className="w-5 h-5" />
            <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-800 leading-relaxed mb-4">
          {question.question}
        </h3>

        {/* Skills */}
        {question.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {question.skills.map(
              (skill: string): JSX.Element => (
                <span
                  key={skill}
                  className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                >
                  {skill}
                </span>
              )
            )}
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {(question.options != null && question.options.length > 0 ? question.options : []).map(
          (option: string, index: number): JSX.Element => {
            // Use question type (should always be defined)
            const questionType = question.type;

            // Determine what value to compare based on question type
            const expectedValue =
              questionType === AssessmentQuestionType.MULTIPLE_CHOICE ? option : index;

            // Improved comparison: handle both string and number types
            const isSelected =
              selectedAnswer !== undefined &&
              (selectedAnswer === expectedValue ||
                String(selectedAnswer) === String(expectedValue) ||
                Number(selectedAnswer) === Number(expectedValue));

            return (
              <button
                key={index}
                type="button"
                onClick={(): void => {
                  const answerValue =
                    questionType === AssessmentQuestionType.MULTIPLE_CHOICE ? option : index;
                  onAnswer(answerValue);
                }}
                disabled={false}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* Question Type Indicator */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2 text-sm text-slate-500">
                <span className="capitalize">
                  {String(question.type).replace('_', ' ')}
                </span>
          <span>•</span>
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
          <span>{question.category != null && question.category !== '' ? question.category : 'general'}</span>
        </div>
      </div>
    </div>
  );
};

interface AssessmentCompleteProps {
  result: AssessmentResult;
  assessment: Assessment;
  onRetake: () => void;
  onContinue: () => void;
}

// eslint-disable-next-line max-lines-per-function
const AssessmentComplete: React.FC<AssessmentCompleteProps> = ({
  result,
  assessment,
  onRetake,
  onContinue,
}): JSX.Element => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) {
      return 'text-green-600';
    }
    if (score >= 60) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getScoreMessage = (score: number): string => {
    if (score >= 90) {
      return 'Excellent! You have a strong understanding of this topic.';
    }
    if (score >= 80) {
      return 'Great job! You have a good grasp of the concepts.';
    }
    if (score >= 60) {
      return 'Good effort! Consider reviewing some areas.';
    }
    return 'Keep studying! Focus on the fundamentals.';
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-slate-200 animate-fade-in">
      <div className="mb-6">
        <TrophyIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Assessment Complete!</h2>
        <p className="text-lg text-slate-600">{assessment.title}</p>
      </div>

      {/* Score Display */}
      <div className="mb-8">
        <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
          {result.score}%
        </div>
        <p className="text-lg text-slate-700 mb-4">{getScoreMessage(result.score)}</p>

        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 mb-1">
                {result.correctAnswers}/{result.totalQuestions}
              </div>
              <div className="text-sm text-slate-600">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatTime(result.timeSpent)}
              </div>
              <div className="text-sm text-slate-600">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1 capitalize">
                {result.skillLevel}
              </div>
              <div className="text-sm text-slate-600">Skill Level</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <LightBulbIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-800">Recommendations</h3>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <ul className="text-left space-y-2">
              {result.recommendations.map(
                (recommendation: string, index: number): JSX.Element => (
                  <li key={index} className="text-sm text-indigo-700 flex items-start space-x-2">
                    <span className="text-indigo-500 mt-1">•</span>
                    <span>{recommendation}</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onRetake}
          className="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
        >
          Retake Assessment
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Continue to Learning Path
        </button>
      </div>
    </div>
  );
};

// eslint-disable-next-line max-lines-per-function
const SkillAssessment: React.FC<SkillAssessmentProps> = ({
  assessment,
  onComplete,
  onBack,
  onSubmitResult,
  onSetupLearningPath,
}): JSX.Element => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(assessment.duration * 60); // Convert to seconds
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Guard against undefined questions array or out-of-bounds index
  const questions = useMemo(
    (): AssessmentQuestion[] => assessment.questions,
    [assessment.questions]
  );
  const currentQuestion = questions[currentQuestionIndex];

  // Memoize selectedAnswer to ensure it updates when answers or currentQuestion changes
  const selectedAnswer = useMemo((): string | number | undefined => {
    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
      return undefined;
    }
    const answer = answers.find(
      (a: AssessmentAnswer): boolean => a.questionId === currentQuestion.id
    );
    const result = answer?.selectedAnswer;

    return result;
  }, [answers, currentQuestion, currentQuestionIndex, questions.length]);

  // Timer effect
  const handleComplete = useCallback((): void => {
    const endTime = Date.now();
    const totalTimeSpent = Math.floor((endTime - startTime) / 1000 / 60); // Convert to minutes

    // Recalculate isCorrect for each answer to ensure accuracy
    // Also check all questions to ensure we have answers for all
    const answersWithRecalculatedCorrect = questions.map((question): AssessmentAnswer => {
      const existingAnswer = answers.find(
        (a: AssessmentAnswer): boolean => a.questionId === question.id
      );

      if (existingAnswer == null) {
        return {
          questionId: question.id,
          selectedAnswer: -1,
          isCorrect: false,
          timeSpent: 0,
        };
      }

      // Convert selectedAnswer to number index
      let answerAsNumber: number;
      if (typeof existingAnswer.selectedAnswer === 'number') {
        answerAsNumber = existingAnswer.selectedAnswer;
      } else if (question.options != null && question.options.length > 0) {
        answerAsNumber = question.options.indexOf(String(existingAnswer.selectedAnswer));
      } else {
        answerAsNumber = -1;
      }

      // Convert correctAnswer to number index
      const correctAnswerAsNumber: number =
        typeof question.correctAnswer === 'number'
          ? question.correctAnswer
          : question.options != null && question.options.length > 0
          ? question.options.indexOf(String(question.correctAnswer))
          : -1;

      const isCorrect = answerAsNumber >= 0 && answerAsNumber === correctAnswerAsNumber;

      // Debug logging removed to prevent infinite loops

      return { ...existingAnswer, isCorrect };
    });

    const correctAnswers = answersWithRecalculatedCorrect.filter(
      (a: AssessmentAnswer): boolean => a.isCorrect === true
    ).length;
    const totalQuestions = questions.length > 0 ? questions.length : 1; // Prevent division by zero
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Determine skill level based on score
    let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (score >= 80) {
      skillLevel = 'advanced';
    } else if (score >= 60) {
      skillLevel = 'intermediate';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (score < 60) {
      recommendations.push('Focus on fundamental concepts and basic principles');
      recommendations.push('Consider taking beginner-level courses before advancing');
    } else if (score < 80) {
      recommendations.push('Review areas where you made mistakes');
      recommendations.push('Practice more exercises to strengthen your understanding');
    } else {
      recommendations.push("You're ready for advanced topics and real-world projects");
      recommendations.push('Consider mentoring others or contributing to open-source projects');
    }

    const assessmentResult: AssessmentResult = {
      id: `result_${Date.now()}`,
      userId: 'current-user', // This should come from auth context
      assessmentId: assessment.id,
      score,
      totalQuestions: questions.length,
      correctAnswers,
      timeSpent: totalTimeSpent,
      answers: answersWithRecalculatedCorrect, // Use recalculated answers
      completedAt: new Date().toISOString(),
      skillLevel,
      recommendations,
    };

    // Fire-and-forget backend submit if provided
    try {
      if (onSubmitResult != null) {
        // Convert answers to backend format: selectedAnswer must be a number (index)
        const compact = answers.map(
          (a: AssessmentAnswer): { questionId: string; selectedAnswer: number } => {
            // Find the question to get its type and options
            const question = questions.find((q): boolean => q.id === a.questionId);

            let selectedAnswerAsNumber: number;
            if (typeof a.selectedAnswer === 'number') {
              // Already a number, use it directly
              selectedAnswerAsNumber = a.selectedAnswer;
            } else if (question?.options != null && question.options.length > 0) {
              // Find the index of the selected option string
              const optionIndex = question.options.indexOf(String(a.selectedAnswer));
              selectedAnswerAsNumber = optionIndex >= 0 ? optionIndex : 0;
            } else {
              // Fallback to 0 if we can't convert
              selectedAnswerAsNumber = 0;
            }

            return {
              questionId: a.questionId,
              selectedAnswer: selectedAnswerAsNumber,
            };
          }
        );

        Promise.resolve(onSubmitResult(assessment.id, compact, totalTimeSpent)).catch((): void => {
          // Ignore errors
        });
      }
    } catch {
      // Ignore errors
    }

    setResult(assessmentResult);
    setIsComplete(true);
    onComplete(assessmentResult);
  }, [answers, questions, assessment, startTime, onComplete, onSubmitResult]);

  useEffect((): (() => void) | undefined => {
    if (isComplete === true) {
      return undefined;
    }

    const timer = setInterval((): void => {
      setTimeRemaining((prev: number): number => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return (): void => {
      clearInterval(timer);
    };
  }, [isComplete, handleComplete]);

  const handleAnswer = useCallback(
    (answer: string | number): void => {
      if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
        return;
      }
      const questionStartTime = Date.now();
      const timeSpent = Math.floor((questionStartTime - startTime) / 1000);

      // Calculate isCorrect: convert answer to number index for comparison
      // This matches the backend logic which compares numeric indices
      let answerAsNumber: number;
      if (typeof answer === 'number') {
        answerAsNumber = answer;
      } else if (currentQuestion.options != null && currentQuestion.options.length > 0) {
        // For MULTIPLE_CHOICE, find the index of the selected option
        answerAsNumber = currentQuestion.options.indexOf(String(answer));
      } else {
        answerAsNumber = -1; // Invalid
      }

      // Compare with correctAnswer (which should be a number index)
      const correctAnswerAsNumber: number =
        typeof currentQuestion.correctAnswer === 'number'
          ? currentQuestion.correctAnswer
          : currentQuestion.options != null && currentQuestion.options.length > 0
          ? currentQuestion.options.indexOf(String(currentQuestion.correctAnswer))
          : -1;

      const isCorrect = answerAsNumber >= 0 && answerAsNumber === correctAnswerAsNumber;

      const newAnswer: AssessmentAnswer = {
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        isCorrect,
        timeSpent,
      };

      setAnswers((prev: AssessmentAnswer[]): AssessmentAnswer[] => {
        const existingIndex = prev.findIndex(
          (a: AssessmentAnswer): boolean => a.questionId === currentQuestion.id
        );
        if (existingIndex >= 0) {
          // Update existing answer
          const updated = [...prev];
          updated[existingIndex] = newAnswer;
          return updated;
        }
        // Add new answer
        return [...prev, newAnswer];
      });
    },
    [currentQuestion, startTime, currentQuestionIndex, questions.length]
  );

  const handleNext = useCallback((): void => {
    if (questions.length === 0) {
      handleComplete();
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev: number): number => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentQuestionIndex, questions.length, handleComplete]);

  const handleRetake = (): void => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTimeRemaining(assessment.duration * 60);
    setIsComplete(false);
    setResult(null);
  };

  if (isComplete === true && result != null) {
    return (
      <AssessmentComplete
        result={result}
        assessment={assessment}
        onRetake={handleRetake}
        // eslint-disable-next-line complexity
        onContinue={async (): Promise<void> => {
          try {
            const assessmentWithObjectiveId = assessment as Assessment & { objectiveId?: string };
            const objectiveId: string | undefined = assessmentWithObjectiveId.objectiveId;

            if (objectiveId != null && objectiveId !== '' && onSetupLearningPath != null) {
              try {
                await onSetupLearningPath(objectiveId);
                return;
              } catch (setupError: unknown) {
                console.error('Error in onSetupLearningPath:', setupError);
                throw setupError;
              }
            }

            if (objectiveId != null && objectiveId !== '') {
              const res = await apiService.generateLearningPaths(objectiveId);
              if (res.success === true) {
                toast.success('Learning paths generated');
                const paths = (res.data ?? []) as Array<{ id: string }>;
                const first = paths.length > 0 ? paths[0] : undefined;
                if (first != null) {
                  navigate(`/objectives/${objectiveId}/paths/${first.id}`);
                  return;
                }
                onBack();
              } else {
                const errorMessage: string =
                  res.error?.message != null && res.error.message !== ''
                    ? res.error.message
                    : 'Failed to generate learning paths';
                toast.error(errorMessage);
              }
            } else {
              toast.error('Objective ID not found');
              onBack();
            }
          } catch (err: unknown) {
            const error = err as {
              response?: { data?: { error?: { message?: string }; message?: string } };
              message?: string;
            };
            const errorMsg: string =
              error.response?.data?.error?.message ??
              error.response?.data?.message ??
              error.message ??
              'Failed to generate learning paths. Please try again.';
            toast.error(errorMsg);
            // stay on completion view, allow user to retry clicking Continue
          }
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </button>
            <div className="h-6 w-px bg-slate-300" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">{assessment.title}</h1>
              <p className="text-sm font-medium text-indigo-600">{assessment.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-slate-600">
              <ClockIcon className="w-5 h-5" />
              <span className="font-mono font-semibold">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="text-sm text-slate-500">
              {answers.length} of {questions.length} answered
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      {currentQuestionIndex >= 0 && currentQuestionIndex < questions.length ? (
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          selectedAnswer={selectedAnswer}
          timeRemaining={timeRemaining}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 text-center">
          <p className="text-slate-600">No questions available in this assessment.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={(): void => {
            setCurrentQuestionIndex((prev: number): number => Math.max(0, prev - 1));
          }}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          {questions.length === 0 || currentQuestionIndex === questions.length - 1
            ? 'Complete'
            : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default SkillAssessment;
