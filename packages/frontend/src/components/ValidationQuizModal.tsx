import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { QuizQuestion } from '../types';
import { X, Clock, CheckCircle, XCircle, ArrowRight, Trophy, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ValidationQuizModalProps {
  isOpen: boolean;
  quiz: QuizQuestion[];
  moduleTitle: string;
  onClose: () => void;
  onSubmit: (
    answers: Array<{ questionId: string; selectedAnswer: string | number }>,
    timeSpent: number
  ) => Promise<{
    score: number;
    passed: boolean;
    feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
  }>;
  onPass?: () => void;
  onFail?: () => void;
}

interface QuizResultsProps {
  result: {
    score: number;
    passed: boolean;
    feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
  };
  quiz: QuizQuestion[];
  answers: Array<{ questionId: string; selectedAnswer: string | number }>;
  onClose: () => void;
  onRetry: () => void;
}

// eslint-disable-next-line max-lines-per-function
const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  quiz,
  answers,
  onClose,
  onRetry,
}): JSX.Element => {
  const correctCount = result.feedback.filter(
    (f: { questionId: string; correct: boolean; explanation?: string }): boolean => f.correct
  ).length;
  const incorrectCount = result.feedback.filter(
    (f: { questionId: string; correct: boolean; explanation?: string }): boolean => !f.correct
  ).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Quiz Results</h2>
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
                result.passed === true ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {result.passed === true ? (
                <Trophy className="w-12 h-12 text-green-600" />
              ) : (
                <XCircle className="w-12 h-12 text-red-600" />
              )}
            </div>
            <h3
              className={`text-3xl font-bold mb-2 ${
                result.passed === true ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {result.passed === true ? 'Congratulations!' : 'Try Again'}
            </h3>
            <p className="text-lg text-slate-600 mb-4">
              You scored <span className="font-bold">{result.score}%</span>
            </p>
            <p className="text-sm text-slate-500">
              {result.passed === true
                ? 'You have successfully validated this module!'
                : 'You need 70% to pass. Review the flashcards and try again.'}
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

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800">Question Review</h4>
            {quiz.map((question: QuizQuestion, index: number): JSX.Element => {
              const feedback = result.feedback.find(
                (f: { questionId: string; correct: boolean; explanation?: string }): boolean =>
                  f.questionId === question.id
              );
              const userAnswer = answers.find(
                (a: { questionId: string; selectedAnswer: string | number }): boolean =>
                  a.questionId === question.id
              );
              return (
                <div
                  key={question.id}
                  className={`border rounded-lg p-4 ${
                    feedback != null && feedback.correct === true
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-slate-800">
                      {index + 1}. {question.question}
                    </p>
                    {feedback != null && feedback.correct === true ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-1">
                    Your answer:{' '}
                    {
                      question.options[
                        userAnswer != null && typeof userAnswer.selectedAnswer === 'number'
                          ? userAnswer.selectedAnswer
                          : 0
                      ]
                    }
                  </p>
                  <p className="text-sm text-slate-700 font-medium">
                    Correct answer: {question.options[question.correctAnswer]}
                  </p>
                  {feedback?.explanation != null && feedback.explanation !== '' && (
                    <p className="text-sm text-slate-600 mt-2 italic">{feedback.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            {result.passed !== true && (
              <button
                onClick={onRetry}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Quiz</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
            >
              {result.passed === true ? 'Continue' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QuizViewProps {
  quiz: QuizQuestion[];
  currentQuestionIndex: number;
  currentAnswer: { questionId: string; selectedAnswer: string | number } | undefined;
  allAnswered: boolean;
  isSubmitting: boolean;
  timeSpent: number;
  moduleTitle: string;
  onAnswer: (questionId: string, answer: string | number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => Promise<void>;
  onClose: () => void;
}

// eslint-disable-next-line max-lines-per-function
const QuizView: React.FC<QuizViewProps> = ({
  quiz,
  currentQuestionIndex,
  currentAnswer,
  allAnswered,
  isSubmitting,
  timeSpent,
  moduleTitle,
  onAnswer,
  onNext,
  onPrevious,
  onSubmit,
  onClose,
}): JSX.Element => {
  const currentQuestion = quiz[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Validation Quiz</h2>
              <p className="text-sm text-slate-600 mt-1">{moduleTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">
                Question {currentQuestionIndex + 1} of {quiz.length}
              </span>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>{timeSpent} min</span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {currentQuestion.question}
            </h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, index: number): JSX.Element => {
                const isSelected = currentAnswer != null && currentAnswer.selectedAnswer === index;
                return (
                  <button
                    key={index}
                    onClick={(): void => {
                      onAnswer(currentQuestion.id, index);
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                        }`}
                      >
                        {isSelected === true && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="font-medium">{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onPrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentQuestionIndex === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center space-x-2">
              {allAnswered === true && (
                <button
                  onClick={onSubmit}
                  disabled={isSubmitting === true}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting === true ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Quiz</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {currentQuestionIndex < quiz.length - 1 && (
                <button
                  onClick={onNext}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// eslint-disable-next-line max-lines-per-function
const ValidationQuizModal: React.FC<ValidationQuizModalProps> = ({
  isOpen,
  quiz,
  moduleTitle,
  onClose,
  onSubmit,
  onPass,
  onFail,
}): JSX.Element | null => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Array<{ questionId: string; selectedAnswer: string | number }>
  >([]);
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    feedback: Array<{ questionId: string; correct: boolean; explanation?: string }>;
  } | null>(null);

  useEffect((): void => {
    if (!isOpen) {
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setTimeSpent(0);
      setResult(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect((): (() => void) | undefined => {
    if (!isOpen || result != null) {
      return undefined;
    }
    const interval = setInterval((): void => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60)); // minutes
    }, 1000);
    return (): void => {
      clearInterval(interval);
    };
  }, [isOpen, startTime, result]);

  const handleAnswer = useCallback((questionId: string, answer: string | number): void => {
    setAnswers(
      (
        prev: Array<{ questionId: string; selectedAnswer: string | number }>
      ): Array<{ questionId: string; selectedAnswer: string | number }> => {
        const filtered = prev.filter(
          (a: { questionId: string; selectedAnswer: string | number }): boolean =>
            a.questionId !== questionId
        );
        return [...filtered, { questionId, selectedAnswer: answer }];
      }
    );
  }, []);

  const handleNext = useCallback((): void => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex((prev: number): number => prev + 1);
    }
  }, [currentQuestionIndex, quiz.length]);

  const handlePrevious = useCallback((): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev: number): number => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (answers.length < quiz.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTimeSpent = Math.floor((Date.now() - startTime) / 1000 / 60);
      const submitResult = await onSubmit(answers, finalTimeSpent);
      setResult(submitResult);

      if (submitResult.passed === true) {
        toast.success(`Congratulations! You passed with ${submitResult.score}%`);
        setTimeout((): void => {
          if (onPass != null) {
            onPass();
          }
          onClose();
        }, 2000);
      } else {
        toast.error(`You scored ${submitResult.score}%. Need 70% to pass.`);
        if (onFail != null) {
          onFail();
        }
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      const errorMessage: string =
        error.message != null && error.message !== '' ? error.message : 'Failed to submit quiz';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, quiz.length, startTime, onSubmit, onPass, onFail, onClose]);

  if (!isOpen) {
    return null;
  }

  const currentQuestion = quiz[currentQuestionIndex];
  const currentAnswer = answers.find(
    (a: { questionId: string; selectedAnswer: string | number }): boolean =>
      a.questionId === currentQuestion.id
  );
  const allAnswered = answers.length === quiz.length;

  const handleRetry = (): void => {
    setResult(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTimeSpent(0);
  };

  // Display results
  if (result != null) {
    return (
      <QuizResults
        result={result}
        quiz={quiz}
        answers={answers}
        onClose={onClose}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <QuizView
      quiz={quiz}
      currentQuestionIndex={currentQuestionIndex}
      currentAnswer={currentAnswer}
      allAnswered={allAnswered}
      isSubmitting={isSubmitting}
      timeSpent={timeSpent}
      moduleTitle={moduleTitle}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
};

export default ValidationQuizModal;
