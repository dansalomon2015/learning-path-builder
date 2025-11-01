import type React from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { LearningPlan, Flashcard } from '@/types';
import { ArrowLeftIcon, TrophyIcon, ClockIcon, CodeIcon } from './icons';

interface FlashcardViewProps {
  plan: LearningPlan;
  mode: 'flashcards' | 'quiz';
  onBack: () => void;
  onComplete?: () => void;
}

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort((): number => Math.random() - 0.5);
};

// Helper function to format time
const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

// Spaced Repetition Component
/* eslint-disable max-lines-per-function */
const SpacedRepetitionMode: React.FC<{
  plan: LearningPlan;
  onBack: () => void;
  elapsedTime: number;
  onComplete: () => void;
}> = ({ plan, onBack, elapsedTime, onComplete }): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [key, setKey] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const card = useMemo(
    (): Flashcard | undefined => plan.flashcards[currentIndex],
    [plan.flashcards, currentIndex]
  );
  const progressPercentage = useMemo(
    (): number => ((currentIndex + 1) / plan.flashcards.length) * 100,
    [currentIndex, plan.flashcards.length]
  );

  const handleNext = (_knewIt: boolean): void => {
    if (currentIndex < plan.flashcards.length - 1) {
      setIsFlipped(false);
      setTimeout((): void => {
        setCurrentIndex((prev: number): number => prev + 1);
        setKey((prev: number): number => prev + 1);
      }, 150);
    } else {
      onComplete();
      setIsComplete(true);
    }
  };

  if (isComplete === true) {
    return (
      <div className="text-center bg-white p-8 rounded-xl shadow-lg animate-fade-in">
        <TrophyIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Deck Complete!</h2>
        <p className="text-lg text-slate-600 mb-6">Great job finishing this study session.</p>
        <div className="bg-slate-100 rounded-lg p-6 mb-8">
          <p className="text-xl text-slate-700">Total Time</p>
          <p className="text-5xl font-bold text-indigo-600 my-2">{formatTime(elapsedTime)}</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-right text-sm font-semibold text-slate-500 mt-2">
          Card {currentIndex + 1} of {plan.flashcards.length}
        </p>
      </div>

      <div className="w-full h-80 [perspective:1000px]" key={key}>
        <div
          className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped === true ? '[transform:rotateY(180deg)]' : ''
          }`}
          onClick={(): void => {
            setIsFlipped(!isFlipped);
          }}
        >
          <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl flex items-center justify-center p-6 text-center [backface-visibility:hidden] cursor-pointer">
            <p className="text-2xl md:text-3xl font-semibold text-slate-800">{card?.question ?? ''}</p>
          </div>
          <div className="absolute w-full h-full bg-indigo-500 text-white rounded-2xl shadow-xl flex items-center justify-center p-6 text-center [transform:rotateY(180deg)] [backface-visibility:hidden] cursor-pointer">
            <div>
              <p className="text-xl md:text-2xl font-medium mb-4">{card?.answer ?? ''}</p>
              {card?.explanation != null && card.explanation !== '' && (
                <p className="text-sm opacity-90">{card.explanation}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-slate-500 text-sm mt-4">Click card to flip</p>

      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={(): void => {
            handleNext(false);
          }}
          className="px-10 py-4 bg-red-100 text-red-700 rounded-xl font-bold text-lg hover:bg-red-200 transition-colors transform hover:scale-105"
        >
          Again
        </button>
        <button
          onClick={(): void => {
            handleNext(true);
          }}
          className="px-10 py-4 bg-green-100 text-green-700 rounded-xl font-bold text-lg hover:bg-green-200 transition-colors transform hover:scale-105"
        >
          Good
        </button>
      </div>
    </>
  );
};
/* eslint-enable max-lines-per-function */

// Quiz Mode Component
/* eslint-disable max-lines-per-function */
const QuizMode: React.FC<{
  plan: LearningPlan;
  onBack: () => void;
  elapsedTime: number;
  onComplete: () => void;
}> = ({ plan, onBack, elapsedTime, onComplete }): JSX.Element => {
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const resetQuiz = useCallback((): void => {
    setShuffledCards(shuffleArray(plan.flashcards));
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [plan.flashcards]);

  useEffect((): void => {
    resetQuiz();
  }, [resetQuiz]);

  const currentCard = useMemo(
    (): Flashcard | undefined => shuffledCards[currentIndex],
    [shuffledCards, currentIndex]
  );
  const isQuizFinished = useMemo(
    (): boolean => currentIndex >= shuffledCards.length,
    [currentIndex, shuffledCards.length]
  );

  useEffect((): void => {
    if (isQuizFinished === true) {
      onComplete();
    }
  }, [isQuizFinished, onComplete]);

  const quizOptions = useMemo((): string[] => {
    if (currentCard == null) {
      return [];
    }
    const correctAnswer = currentCard.answer;
    const distractors = shuffleArray(
      plan.flashcards
        .filter((fc): boolean => fc.id !== currentCard.id)
        .map((fc): string => fc.answer)
    ).slice(0, 3);
    return shuffleArray([correctAnswer, ...distractors]);
  }, [currentCard, plan.flashcards]);

  const handleAnswerSelect = (answer: string): void => {
    if (showFeedback === true || currentCard == null) {
      return;
    }
    setSelectedAnswer(answer);
    if (answer === currentCard.answer) {
      setScore((prev: number): number => prev + 1);
    }
    setShowFeedback(true);
  };

  const handleNextQuestion = (): void => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setCurrentIndex((prev: number): number => prev + 1);
  };

  if (shuffledCards.length === 0) {
    return <div>Loading quiz...</div>;
  }

  if (isQuizFinished === true) {
    const percentage =
      shuffledCards.length > 0 ? Math.round((score / shuffledCards.length) * 100) : 0;

    return (
      <div className="text-center bg-white p-8 rounded-xl shadow-lg animate-fade-in">
        <div className="flex justify-center mb-4">
          <TrophyIcon className="w-16 h-16 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
        <p className="text-lg text-slate-600 mb-6">You&apos;ve successfully completed the quiz.</p>
        <div className="bg-slate-100 rounded-lg p-6 mb-8 sm:flex sm:justify-around sm:items-center space-y-4 sm:space-y-0">
          <div className="text-center">
            <p className="text-xl text-slate-700">Your Score</p>
            <p className="text-5xl font-bold text-indigo-600 my-2">
              {score} / {shuffledCards.length}
            </p>
            <p className="text-lg font-semibold text-slate-600">({percentage}%)</p>
          </div>
          <div className="hidden sm:block border-l border-slate-300 h-20 mx-4" />
          <div className="text-center">
            <p className="text-xl text-slate-700">Time Taken</p>
            <p className="text-5xl font-bold text-indigo-600 my-2">{formatTime(elapsedTime)}</p>
            <p className="text-lg font-semibold text-slate-600">&nbsp;</p>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={resetQuiz}
            className="px-6 py-3 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
          >
            Retry Quiz
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
  }

  const progressPercentage: number =
    shuffledCards.length > 0 ? ((currentIndex + 1) / shuffledCards.length) * 100 : 0;

  return (
    <>
      <div className="mb-6">
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-right text-sm font-semibold text-slate-500 mt-2">
          Question {currentIndex + 1} of {shuffledCards.length}
        </p>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-8">
          {currentCard?.question ?? ''}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizOptions.map((option: string, index: number): JSX.Element => {
            const isCorrect: boolean = currentCard != null && option === currentCard.answer;
            const isSelected: boolean = option === selectedAnswer;
            let buttonClass: string =
              'p-4 border-2 border-slate-200 rounded-lg text-left text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200';
            if (showFeedback === true) {
              if (isCorrect === true) {
                buttonClass =
                  'p-4 border-2 border-green-500 bg-green-100 rounded-lg text-left text-green-800 font-semibold';
              } else if (isSelected === true) {
                buttonClass =
                  'p-4 border-2 border-red-500 bg-red-100 rounded-lg text-left text-red-800 font-semibold';
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
                {option}
              </button>
            );
          })}
        </div>
      </div>
      {showFeedback === true && currentCard != null && (
        <div className="mt-6 animate-fade-in">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">
              {selectedAnswer === currentCard.answer ? 'Correct!' : 'Correct Answer:'}
            </h3>
            <p className="text-slate-800 font-medium">{currentCard.answer}</p>
            {currentCard.explanation != null && currentCard.explanation !== '' && (
              <>
                <hr className="my-3 border-slate-200" />
                <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                  <CodeIcon className="w-4 h-4" />
                  Explanation:
                </h3>
                <p className="text-slate-700 text-sm">{currentCard.explanation}</p>
              </>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleNextQuestion}
              className="px-10 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};
/* eslint-enable max-lines-per-function */

// Main View Component
const FlashcardView: React.FC<FlashcardViewProps> = ({ plan, mode, onBack }): JSX.Element => {
  const [startTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [sessionFinished, setSessionFinished] = useState(false);

  useEffect((): (() => void) | undefined => {
    if (sessionFinished === true) {
      return undefined;
    }

    const timer = setInterval((): void => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return (): void => {
      clearInterval(timer);
    };
  }, [startTime, sessionFinished]);

  const handleSessionComplete = useCallback((): void => {
    setSessionFinished(true);
  }, []);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-800">{plan.title}</h1>
          <p className="text-sm font-medium text-indigo-600 capitalize">{mode.replace('-', ' ')}</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 text-slate-500 mb-4 px-2">
        <ClockIcon className="w-5 h-5" />
        <span className="font-mono font-semibold">{formatTime(elapsedTime)}</span>
      </div>

      {mode === 'quiz' ? (
        <QuizMode
          plan={plan}
          onBack={onBack}
          elapsedTime={elapsedTime}
          onComplete={handleSessionComplete}
        />
      ) : (
        <SpacedRepetitionMode
          plan={plan}
          onBack={onBack}
          elapsedTime={elapsedTime}
          onComplete={handleSessionComplete}
        />
      )}
    </div>
  );
};

export default FlashcardView;
