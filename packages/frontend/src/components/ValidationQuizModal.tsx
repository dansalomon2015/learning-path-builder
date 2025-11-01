import React, { useState, useEffect, useCallback } from 'react';
import { QuizQuestion } from '../types';
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
  ) => Promise<{ score: number; passed: boolean; feedback: any[] }>;
  onPass?: () => void;
  onFail?: () => void;
}

const ValidationQuizModal: React.FC<ValidationQuizModalProps> = ({
  isOpen,
  quiz,
  moduleTitle,
  onClose,
  onSubmit,
  onPass,
  onFail,
}) => {
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

  useEffect(() => {
    if (!isOpen) {
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setTimeSpent(0);
      setResult(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || result) return;
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60)); // minutes
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, startTime, result]);

  const handleAnswer = useCallback((questionId: string, answer: string | number) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== questionId);
      return [...filtered, { questionId, selectedAnswer: answer }];
    });
  }, []);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, quiz.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleSubmit = useCallback(async () => {
    if (answers.length < quiz.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalTimeSpent = Math.floor((Date.now() - startTime) / 1000 / 60);
      const result = await onSubmit(answers, finalTimeSpent);
      setResult(result);

      if (result.passed) {
        toast.success(`Congratulations! You passed with ${result.score}%`);
        setTimeout(() => {
          onPass?.();
          onClose();
        }, 2000);
      } else {
        toast.error(`You scored ${result.score}%. Need 70% to pass.`);
        onFail?.();
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, quiz.length, startTime, onSubmit, onPass, onFail, onClose]);

  if (!isOpen) return null;

  const currentQuestion = quiz[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
  const allAnswered = answers.length === quiz.length;

  // Afficher les résultats
  if (result) {
    const correctCount = result.feedback.filter(f => f.correct).length;
    const incorrectCount = result.feedback.filter(f => !f.correct).length;

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
                {result.passed ? 'Congratulations!' : 'Try Again'}
              </h3>
              <p className="text-lg text-slate-600 mb-4">
                You scored <span className="font-bold">{result.score}%</span>
              </p>
              <p className="text-sm text-slate-500">
                {result.passed
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
              {quiz.map((question, index) => {
                const feedback = result.feedback.find(f => f.questionId === question.id);
                const userAnswer = answers.find(a => a.questionId === question.id);
                return (
                  <div
                    key={question.id}
                    className={`border rounded-lg p-4 ${
                      feedback?.correct
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-slate-800">
                        {index + 1}. {question.question}
                      </p>
                      {feedback?.correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      Your answer: {question.options[Number(userAnswer?.selectedAnswer) || 0]}
                    </p>
                    <p className="text-sm text-slate-700 font-medium">
                      Correct answer: {question.options[question.correctAnswer]}
                    </p>
                    {feedback?.explanation && (
                      <p className="text-sm text-slate-600 mt-2 italic">{feedback.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              {!result.passed && (
                <button
                  onClick={() => {
                    setResult(null);
                    setCurrentQuestionIndex(0);
                    setAnswers([]);
                    setTimeSpent(0);
                  }}
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
                {result.passed ? 'Continue' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          {/* Header */}
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

          {/* Progress */}
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

          {/* Question */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {currentQuestion.question}
            </h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentAnswer?.selectedAnswer === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(currentQuestion.id, index)}
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
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="font-medium">{option}</span>
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
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentQuestionIndex === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center space-x-2">
              {allAnswered && (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
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
                  onClick={handleNext}
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

export default ValidationQuizModal;
