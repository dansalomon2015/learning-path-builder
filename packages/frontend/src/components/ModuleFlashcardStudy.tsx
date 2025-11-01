import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Flashcard } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface ModuleFlashcardStudyProps {
  flashcards: Flashcard[];
  onComplete: () => void;
  onBack: () => void;
  objectiveId?: string;
  pathId?: string;
  moduleId?: string;
  initialMasteredCardIds?: string[]; // IDs des cartes maîtrisées sauvegardées
  onProgressUpdate?: (masteryPercentage: number, masteredCardIds: string[]) => Promise<void>;
}

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Helper function to format time
const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const ModuleFlashcardStudy: React.FC<ModuleFlashcardStudyProps> = ({
  flashcards,
  onComplete,
  onBack,
  objectiveId,
  pathId,
  moduleId,
  initialMasteredCardIds = [],
  onProgressUpdate,
}) => {
  const [startTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [key, setKey] = useState(0); // Used to reset animation state
  // Initialiser avec les cartes maîtrisées sauvegardées
  const [masteredCards, setMasteredCards] = useState<Set<string>>(
    new Set(initialMasteredCardIds || [])
  );
  const [sessionFinished, setSessionFinished] = useState(false);
  const savingProgressRef = useRef(false);

  // Réinitialiser les cartes maîtrisées si initialMasteredCardIds change (quand le module est rechargé)
  const initialMasteredCardIdsString = useMemo(
    () => (initialMasteredCardIds || []).sort().join(','),
    [initialMasteredCardIds]
  );

  useEffect(() => {
    // Initialiser ou réinitialiser avec les cartes maîtrisées sauvegardées
    if (initialMasteredCardIds && initialMasteredCardIds.length >= 0) {
      setMasteredCards(new Set(initialMasteredCardIds));
    }
  }, [initialMasteredCardIdsString]); // Se déclenche uniquement si la liste des IDs change

  useEffect(() => {
    if (sessionFinished) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, sessionFinished]);

  const card = useMemo(() => flashcards[currentIndex], [flashcards, currentIndex]);
  const progressPercentage = useMemo(
    () => ((currentIndex + 1) / flashcards.length) * 100,
    [currentIndex, flashcards.length]
  );

  // Calculate module mastery percentage: (cartes maîtrisées / total) × 100
  const calculateModuleMastery = useCallback(() => {
    if (flashcards.length === 0) return 0;
    const percentage = (masteredCards.size / flashcards.length) * 100;
    return Math.round(percentage);
  }, [masteredCards.size, flashcards.length]);

  // Save progress to backend
  const saveProgress = useCallback(
    async (masteryPercentage: number, masteredCardIdsArray: string[]) => {
      if (savingProgressRef.current) return; // Prevent multiple simultaneous saves

      if (onProgressUpdate) {
        savingProgressRef.current = true;
        try {
          await onProgressUpdate(masteryPercentage, masteredCardIdsArray);
        } catch (error) {
          console.error('Failed to save progress:', error);
        } finally {
          savingProgressRef.current = false;
        }
      }
    },
    [onProgressUpdate]
  );

  const handleNext = useCallback(
    async (knewIt: boolean) => {
      if (card) {
        // Marquer la carte comme maîtrisée ou non
        setMasteredCards(prev => {
          const updated = new Set(prev);
          if (knewIt) {
            // Good → marquer comme maîtrisée
            updated.add(card.id);
          } else {
            // Again → retirer de la liste des maîtrisées
            updated.delete(card.id);
          }

          // Calculer le nouveau pourcentage de maîtrise
          const newMastery =
            flashcards.length > 0 ? Math.round((updated.size / flashcards.length) * 100) : 0;

          // Convertir le Set en Array pour la sauvegarde
          const masteredCardIdsArray = Array.from(updated);

          // Sauvegarder immédiatement
          setTimeout(() => {
            saveProgress(newMastery, masteredCardIdsArray);
          }, 100);

          return updated;
        });
      }

      // Navigation vers la carte suivante
      if (currentIndex < flashcards.length - 1) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setKey(prev => prev + 1);
        }, 150);
      } else {
        // Toutes les flashcards ont été vues
        // Sauvegarder le progrès final et terminer la session
        setTimeout(async () => {
          const finalMastery = calculateModuleMastery();
          const masteredCardIdsArray = Array.from(masteredCards);
          await saveProgress(finalMastery, masteredCardIdsArray);
          onComplete();
          setSessionFinished(true);
        }, 300);
      }
    },
    [currentIndex, flashcards.length, card, onComplete, calculateModuleMastery, saveProgress]
  );

  // Calculer le pourcentage de maîtrise du module
  const masteryPercentage = useMemo(() => {
    return calculateModuleMastery();
  }, [calculateModuleMastery]);

  if (sessionFinished) {
    return (
      <div className="text-center bg-white p-8 rounded-xl shadow-lg animate-fade-in">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Session Complete!</h2>
        <p className="text-lg text-slate-600 mb-6">Great job reviewing all flashcards.</p>
        <div className="bg-slate-100 rounded-lg p-6 mb-8">
          <p className="text-xl text-slate-700 mb-2">Module Mastery</p>
          <p className="text-5xl font-bold text-indigo-600 my-2">{masteryPercentage}%</p>
          <p className="text-sm text-slate-600">
            {masteredCards.size} of {flashcards.length} cards mastered
          </p>
          <p className="text-xl text-slate-700 mt-4">Total Time</p>
          <p className="text-3xl font-bold text-indigo-600 my-2">{formatTime(elapsedTime)}</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm font-semibold text-slate-500">
            Card {currentIndex + 1} of {flashcards.length}
          </p>
          <p className="text-sm font-semibold text-slate-500">
            Module Mastery: {masteryPercentage}% ({masteredCards.size}/{flashcards.length} cards
            mastered)
          </p>
        </div>
      </div>

      {/* Flashcard with 3D flip animation */}
      <div className="w-full h-80 [perspective:1000px]" key={key}>
        <div
          className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl flex items-center justify-center p-6 text-center [backface-visibility:hidden] cursor-pointer border-2 border-slate-200">
            <p className="text-2xl md:text-3xl font-semibold text-slate-800">{card.question}</p>
          </div>
          <div className="absolute w-full h-full bg-indigo-500 text-white rounded-2xl shadow-xl flex items-center justify-center p-6 text-center [transform:rotateY(180deg)] [backface-visibility:hidden] cursor-pointer">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-medium mb-4">{card.answer}</p>
              {card.explanation && (
                <p className="text-sm text-indigo-100 mt-4 italic">{card.explanation}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-slate-500 text-sm mt-4">Click card to flip</p>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={() => handleNext(false)}
          className="px-10 py-4 bg-red-100 text-red-700 rounded-xl font-bold text-lg hover:bg-red-200 transition-colors transform hover:scale-105"
        >
          Again
        </button>
        <button
          onClick={() => handleNext(true)}
          className="px-10 py-4 bg-green-100 text-green-700 rounded-xl font-bold text-lg hover:bg-green-200 transition-colors transform hover:scale-105"
        >
          Good
        </button>
      </div>
    </div>
  );
};

export default ModuleFlashcardStudy;
