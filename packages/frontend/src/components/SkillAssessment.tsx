import React, { useState, useEffect, useCallback } from 'react';
import { Assessment, AssessmentQuestion, AssessmentAnswer } from '../types';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  TrophyIcon,
  ChartBarIcon,
} from './icons';

interface SkillAssessmentProps {
  assessment: Assessment;
  onComplete: (result: AssessmentResult) => void;
  onBack: () => void;
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

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  selectedAnswer,
  timeRemaining,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (seconds: number) => {
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
        <div className="flex flex-wrap gap-2 mb-4">
          {question.skills.map(skill => (
            <span
              key={skill}
              className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const isSelected = selectedAnswer === option || selectedAnswer === index;
          return (
            <button
              key={index}
              onClick={() => onAnswer(question.type === 'multiple_choice' ? option : index)}
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
        })}
      </div>

      {/* Question Type Indicator */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <span className="capitalize">{question.type.replace('_', ' ')}</span>
          <span>•</span>
          <span>{question.category}</span>
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

const AssessmentComplete: React.FC<AssessmentCompleteProps> = ({
  result,
  assessment,
  onRetake,
  onContinue,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent! You have a strong understanding of this topic.';
    if (score >= 80) return 'Great job! You have a good grasp of the concepts.';
    if (score >= 60) return 'Good effort! Consider reviewing some areas.';
    return 'Keep studying! Focus on the fundamentals.';
  };

  const formatTime = (minutes: number) => {
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
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-indigo-700 flex items-start space-x-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
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

const SkillAssessment: React.FC<SkillAssessmentProps> = ({ assessment, onComplete, onBack }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(assessment.duration * 60); // Convert to seconds
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const selectedAnswer = answers.find(a => a.questionId === currentQuestion.id)?.selectedAnswer;

  // Timer effect
  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isComplete]);

  const handleAnswer = useCallback(
    (answer: string | number) => {
      const questionStartTime = Date.now();
      const timeSpent = Math.floor((questionStartTime - startTime) / 1000);

      const newAnswer: AssessmentAnswer = {
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        isCorrect: answer === currentQuestion.correctAnswer,
        timeSpent,
      };

      setAnswers(prev => {
        const existingIndex = prev.findIndex(a => a.questionId === currentQuestion.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newAnswer;
          return updated;
        }
        return [...prev, newAnswer];
      });
    },
    [currentQuestion, startTime]
  );

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentQuestionIndex, assessment.questions.length]);

  const handleComplete = useCallback(() => {
    const endTime = Date.now();
    const totalTimeSpent = Math.floor((endTime - startTime) / 1000 / 60); // Convert to minutes

    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctAnswers / assessment.questions.length) * 100);

    // Determine skill level based on score
    let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (score >= 80) skillLevel = 'advanced';
    else if (score >= 60) skillLevel = 'intermediate';

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
      totalQuestions: assessment.questions.length,
      correctAnswers,
      timeSpent: totalTimeSpent,
      answers,
      completedAt: new Date().toISOString(),
      skillLevel,
      recommendations,
    };

    setResult(assessmentResult);
    setIsComplete(true);
    onComplete(assessmentResult);
  }, [answers, assessment, startTime, onComplete]);

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTimeRemaining(assessment.duration * 60);
    setIsComplete(false);
    setResult(null);
  };

  if (isComplete && result) {
    return (
      <AssessmentComplete
        result={result}
        assessment={assessment}
        onRetake={handleRetake}
        onContinue={() => {
          // TODO: Navigate to learning path
          console.log('Continue to learning path');
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
            <div className="h-6 w-px bg-slate-300"></div>
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
              {answers.length} of {assessment.questions.length} answered
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={assessment.questions.length}
        onAnswer={handleAnswer}
        selectedAnswer={selectedAnswer}
        timeRemaining={timeRemaining}
      />

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          {currentQuestionIndex === assessment.questions.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default SkillAssessment;
