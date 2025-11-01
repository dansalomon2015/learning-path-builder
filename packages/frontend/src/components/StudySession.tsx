import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { LearningPlan } from '../types';
import { Difficulty, StudyMode, DifficultyAdjustment } from '../types';
import { sessionService } from '../services/sessionService';
import type { SessionProgress, SessionStats } from '../services/sessionService';
import {
  ArrowLeftIcon,
  TrophyIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  LightBulbIcon,
  TrendingUpIcon,
} from './icons';

interface StudySessionProps {
  plan: LearningPlan;
  mode: 'flashcards' | 'quiz';
  onBack: () => void;
  onComplete?: () => void;
}

interface SessionHeaderProps {
  plan: LearningPlan;
  mode: 'flashcards' | 'quiz';
  onBack: () => void;
  elapsedTime: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  plan,
  mode,
  onBack,
  elapsedTime,
  isPaused,
  onPause,
  onResume,
}): JSX.Element => {
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
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
            <h1 className="text-xl font-bold text-slate-800">{plan.title}</h1>
            <p className="text-sm font-medium text-indigo-600 capitalize">
              {mode.replace('-', ' ')} Mode
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-slate-600">
            <ClockIcon className="w-5 h-5" />
            <span className="font-mono font-semibold">{formatTime(elapsedTime)}</span>
          </div>

          <button
            onClick={isPaused ? onResume : onPause}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors ${
              isPaused
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isPaused ? (
              <>
                <PlayIcon className="w-4 h-4" />
                Resume
              </>
            ) : (
              <>
                <PauseIcon className="w-4 h-4" />
                Pause
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ProgressBarProps {
  current: number;
  total: number;
  correct: number;
  incorrect: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  correct,
  incorrect,
}): JSX.Element => {
  const progressPercentage = (current / total) * 100;
  const accuracyPercentage = current > 0 ? (correct / current) * 100 : 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-slate-700">
          Card {current} of {total}
        </span>
        <span className="text-sm font-semibold text-slate-600">
          Accuracy: {Math.round(accuracyPercentage)}%
        </span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-indigo-600 h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-slate-600">Correct: {correct}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-slate-600">Incorrect: {incorrect}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FlashcardModeProps {
  plan: LearningPlan;
  session: SessionProgress;
  onComplete: () => void;
}

// eslint-disable-next-line max-lines-per-function
const FlashcardMode: React.FC<FlashcardModeProps> = ({
  plan,
  session,
  onComplete,
}): JSX.Element => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [key, setKey] = useState(0);

  const currentCard = useMemo(
    (): LearningPlan['flashcards'][number] | undefined => plan.flashcards[session.currentCardIndex],
    [plan.flashcards, session.currentCardIndex]
  );

  const handleCardInteraction = useCallback(
    (knewIt: boolean): void => {
      if (currentCard == null) {
        return;
      }
      const responseTime = (Date.now() - cardStartTime) / 1000;

      sessionService.recordCardInteraction(
        currentCard.id,
        knewIt,
        responseTime,
        currentCard.difficulty
      );

      if (session.currentCardIndex < session.totalCards - 1) {
        setIsFlipped(false);
        setCardStartTime(Date.now());
        setTimeout((): void => {
          sessionService.nextCard();
          setKey((prev: number): number => prev + 1);
        }, 150);
      } else {
        onComplete();
      }
    },
    [currentCard, session, onComplete, cardStartTime]
  );

  const handleFlip = useCallback((): void => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  if (currentCard == null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <ProgressBar
        current={session.currentCardIndex + 1}
        total={session.totalCards}
        correct={session.correctAnswers}
        incorrect={session.incorrectAnswers}
      />

      <div className="w-full h-96 [perspective:1000px]" key={key}>
        <div
          className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] cursor-pointer ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
          onClick={handleFlip}
        >
          {/* Front of card */}
          <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl flex items-center justify-center p-8 text-center [backface-visibility:hidden] border-2 border-slate-200">
            <div>
              <div className="mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    currentCard.difficulty === Difficulty.EASY
                      ? 'bg-green-100 text-green-700'
                      : currentCard.difficulty === Difficulty.MEDIUM
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {currentCard.difficulty}
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-semibold text-slate-800 leading-relaxed">
                {currentCard.question}
              </p>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center p-8 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div>
              <p className="text-xl md:text-2xl font-medium mb-4">{currentCard.answer}</p>
              {currentCard.explanation != null && currentCard.explanation !== '' && (
                <div className="mt-4 p-4 bg-white bg-opacity-20 rounded-lg">
                  <p className="text-sm opacity-90">{currentCard.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-slate-500 text-sm">
        Click card to flip • Tap buttons to rate your knowledge
      </p>

      {isFlipped && (
        <div className="flex justify-center gap-4 animate-fade-in">
          <button
            onClick={(): void => {
              handleCardInteraction(false);
            }}
            className="px-8 py-4 bg-red-100 text-red-700 rounded-xl font-bold text-lg hover:bg-red-200 transition-colors transform hover:scale-105 shadow-sm"
          >
            Again
          </button>
          <button
            onClick={(): void => {
              handleCardInteraction(true);
            }}
            className="px-8 py-4 bg-green-100 text-green-700 rounded-xl font-bold text-lg hover:bg-green-200 transition-colors transform hover:scale-105 shadow-sm"
          >
            Good
          </button>
        </div>
      )}
    </div>
  );
};

interface QuizModeProps {
  plan: LearningPlan;
  session: SessionProgress;
  onComplete: () => void;
}

// eslint-disable-next-line max-lines-per-function
const QuizMode: React.FC<QuizModeProps> = ({ plan, session, onComplete }): JSX.Element => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const currentCard = useMemo(
    (): LearningPlan['flashcards'][number] | undefined => plan.flashcards[session.currentCardIndex],
    [plan.flashcards, session.currentCardIndex]
  );

  const quizOptions = useMemo((): string[] => {
    if (currentCard == null) {
      return [];
    }
    const correctAnswer = currentCard.answer;
    const distractors = plan.flashcards
      .filter((fc: LearningPlan['flashcards'][number]): boolean => fc.id !== currentCard.id)
      .map((fc: LearningPlan['flashcards'][number]): string => fc.answer)
      .sort((): number => Math.random() - 0.5)
      .slice(0, 3);
    return [correctAnswer, ...distractors].sort((): number => Math.random() - 0.5);
  }, [currentCard, plan.flashcards]);

  const handleAnswerSelect = useCallback(
    (answer: string): void => {
      if (showFeedback === true || currentCard == null) {
        return;
      }

      setSelectedAnswer(answer);
      const responseTime = (Date.now() - questionStartTime) / 1000;
      const isCorrect = answer === currentCard.answer;

      sessionService.recordCardInteraction(
        currentCard.id,
        isCorrect,
        responseTime,
        currentCard.difficulty
      );

      setShowFeedback(true);
    },
    [showFeedback, currentCard, questionStartTime]
  );

  const handleNextQuestion = useCallback((): void => {
    if (session.currentCardIndex < session.totalCards - 1) {
      setShowFeedback(false);
      setSelectedAnswer(null);
      setQuestionStartTime(Date.now());
      sessionService.nextCard();
    } else {
      onComplete();
    }
  }, [session, onComplete]);

  if (currentCard == null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <ProgressBar
        current={session.currentCardIndex + 1}
        total={session.totalCards}
        correct={session.correctAnswers}
        incorrect={session.incorrectAnswers}
      />

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                currentCard.difficulty === Difficulty.EASY
                  ? 'bg-green-100 text-green-700'
                  : currentCard.difficulty === Difficulty.MEDIUM
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {currentCard.difficulty}
            </span>
            <span className="text-sm text-slate-500">
              Question {session.currentCardIndex + 1} of {session.totalCards}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 leading-relaxed">
            {currentCard.question}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizOptions.map((option: string, index: number): JSX.Element => {
            const isCorrect = option === currentCard.answer;
            const isSelected = option === selectedAnswer;

            let buttonClass =
              'p-4 border-2 border-slate-200 rounded-lg text-left text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200';

            if (showFeedback === true) {
              if (isCorrect === true) {
                buttonClass =
                  'p-4 border-2 border-green-500 bg-green-100 rounded-lg text-left text-green-800 font-semibold';
              } else if (isSelected === true) {
                buttonClass =
                  'p-4 border-2 border-red-500 bg-red-100 rounded-lg text-left text-red-800 font-semibold';
              } else {
                buttonClass =
                  'p-4 border-2 border-slate-200 rounded-lg text-left text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={index}
                onClick={(): void => {
                  handleAnswerSelect(option);
                }}
                disabled={showFeedback === true}
                className={buttonClass}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      showFeedback && isCorrect
                        ? 'border-green-500 bg-green-500'
                        : showFeedback && isSelected && !isCorrect
                        ? 'border-red-500 bg-red-500'
                        : 'border-slate-300'
                    }`}
                  >
                    {showFeedback === true && isCorrect === true && (
                      <span className="text-white text-xs">✓</span>
                    )}
                    {showFeedback === true && isSelected === true && isCorrect === false && (
                      <span className="text-white text-xs">✗</span>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {showFeedback && (
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 animate-fade-in">
          <div className="flex items-center space-x-2 mb-3">
            <LightBulbIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-800">
              {selectedAnswer === currentCard.answer ? 'Correct! 🎉' : 'Incorrect'}
            </h3>
          </div>

          <p className="text-slate-700 mb-4">
            <strong>Answer:</strong> {currentCard.answer}
          </p>

          {currentCard.explanation != null && currentCard.explanation !== '' && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-600 mb-2">Explanation:</h4>
              <p className="text-slate-700">{currentCard.explanation}</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleNextQuestion}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {session.currentCardIndex < session.totalCards - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface SessionCompleteProps {
  plan: LearningPlan;
  mode: 'flashcards' | 'quiz';
  sessionStats: SessionStats;
  onBack: () => void;
  onRestart: () => void;
}

const SessionComplete: React.FC<SessionCompleteProps> = ({
  plan,
  mode: _mode,
  sessionStats,
  onBack,
  onRestart,
}): JSX.Element => {
  const recommendations = sessionService.getAdaptiveRecommendations();

  return (
    <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-slate-200 animate-fade-in">
      <div className="mb-6">
        <TrophyIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Session Complete!</h2>
        <p className="text-lg text-slate-600">Great job studying {plan.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-50 rounded-lg p-6">
          <div className="flex items-center justify-center mb-3">
            <ChartBarIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 mb-1">
            {Math.round(sessionStats.accuracyRate)}%
          </p>
          <p className="text-sm text-slate-600">Accuracy</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-6">
          <div className="flex items-center justify-center mb-3">
            <ClockIcon className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600 mb-1">
            {Math.floor(sessionStats.totalStudyTime / 60)}:
            {(sessionStats.totalStudyTime % 60).toString().padStart(2, '0')}
          </p>
          <p className="text-sm text-slate-600">Time Spent</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-6">
          <div className="flex items-center justify-center mb-3">
            <TrendingUpIcon className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600 mb-1">{sessionStats.currentStreak}</p>
          <p className="text-sm text-slate-600">Day Streak</p>
        </div>
      </div>

      {recommendations.difficultyAdjustment !== DifficultyAdjustment.MAINTAIN && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-indigo-800 mb-2">AI Recommendation</h3>
          <p className="text-sm text-indigo-700">
            Based on your performance, we suggest{' '}
            <strong>
              {recommendations.difficultyAdjustment === DifficultyAdjustment.INCREASE
                ? 'increasing'
                : 'decreasing'}
            </strong>{' '}
            the difficulty level for your next session.
          </p>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
        >
          Study Again
        </button>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

const StudySession: React.FC<StudySessionProps> = ({
  plan,
  mode,
  onBack,
  onComplete,
}): JSX.Element => {
  const [session, setSession] = useState<SessionProgress | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  // Initialize session
  useEffect((): void => {
    const newSession = sessionService.startSession(plan, mode);
    setSession(newSession);
  }, [plan, mode]);

  // Timer effect
  useEffect((): (() => void) | undefined => {
    if (isPaused === true || isComplete === true) {
      return undefined;
    }

    const timer = setInterval((): void => {
      setElapsedTime((prev: number): number => prev + 1);
    }, 1000);

    return (): void => {
      clearInterval(timer);
    };
  }, [isPaused, isComplete]);

  const handlePause = useCallback((): void => {
    sessionService.pauseSession();
    setIsPaused(true);
  }, []);

  const handleResume = useCallback((): void => {
    setIsPaused(false);
  }, []);

  const handleComplete = useCallback((): void => {
    const completedSession = sessionService.completeSession();
    if (completedSession != null) {
      const stats = sessionService.getSessionStats();
      setSessionStats(stats);
      setIsComplete(true);
      if (onComplete != null) {
        onComplete();
      }
    }
  }, [onComplete]);

  const handleRestart = useCallback((): void => {
    const newSession = sessionService.startSession(plan, mode);
    setSession(newSession);
    setElapsedTime(0);
    setIsPaused(false);
    setIsComplete(false);
    setSessionStats(null);
  }, [plan, mode]);

  if (session == null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (isComplete === true && sessionStats != null) {
    return (
      <SessionComplete
        plan={plan}
        mode={mode}
        sessionStats={sessionStats}
        onBack={onBack}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <SessionHeader
        plan={plan}
        mode={mode}
        onBack={onBack}
        elapsedTime={elapsedTime}
        isPaused={isPaused}
        onPause={handlePause}
        onResume={handleResume}
      />

      {mode === StudyMode.QUIZ ? (
        <QuizMode plan={plan} session={session} onComplete={handleComplete} />
      ) : (
        <FlashcardMode plan={plan} session={session} onComplete={handleComplete} />
      )}
    </div>
  );
};

export default StudySession;
