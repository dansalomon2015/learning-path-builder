import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import type { ModuleFinalExam, ModuleFinalExamResult, QuizQuestion } from '../types';

interface ModuleFinalExamModalProps {
  isOpen: boolean;
  moduleId: string;
  pathId: string;
  objectiveId: string;
  moduleTitle: string;
  onClose: () => void;
  onComplete: () => void;
}

interface QuizResultsProps {
  result: ModuleFinalExamResult;
  onClose: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ result, onClose }): JSX.Element => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) {
      return 'text-green-600';
    }
    if (score >= 60) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getScoreMessage = (score: number, passed: boolean): string => {
    if (passed) {
      return 'Congratulations! You passed the final exam. The module is now completed.';
    }
    if (score >= 60) {
      return 'Well done! You are close to passing. Try again to get 80% or more.';
    }
    return 'Continue studying the module resources and try again.';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
          {result.score}%
        </div>
        <p className="text-lg text-muted-foreground mb-4">
          {getScoreMessage(result.score, result.passed)}
        </p>

        <div className="bg-muted rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {result.correctAnswers}/{result.totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatTime(result.timeSpent)}
              </div>
              <div className="text-sm text-muted-foreground">Time Spent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">
                {result.passed ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {result.passed ? 'Passed' : 'Failed'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback détaillé */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Answer Details</h3>
        {result.feedback.map((item, index): JSX.Element => (
          <Card key={item.questionId} className={item.correct ? 'border-green-200' : 'border-red-200'}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm">Question {index + 1}</CardTitle>
                {item.correct ? (
                  <Badge className="bg-green-500">Correct</Badge>
                ) : (
                  <Badge variant="destructive">Incorrect</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{item.question}</p>
              <div className="text-sm">
                <span className="text-muted-foreground">Your answer: </span>
                <span className={item.correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {String(item.userAnswer)}
                </span>
              </div>
              {!item.correct && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Correct answer: </span>
                  <span className="text-green-600 font-medium">{String(item.correctAnswer)}</span>
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-2">{item.explanation}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Fermer</Button>
      </div>
    </div>
  );
};

// eslint-disable-next-line max-lines-per-function
export const ModuleFinalExamModal: React.FC<ModuleFinalExamModalProps> = ({
  isOpen,
  moduleId,
  pathId,
  objectiveId,
  moduleTitle,
  onClose,
  onComplete,
}): JSX.Element | null => {
  const [exam, setExam] = useState<ModuleFinalExam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  const [startTime] = useState<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ModuleFinalExamResult | null>(null);

  // Timer effect
  useEffect((): (() => void) | undefined => {
    if (isOpen && exam != null && !submitting && result == null) {
      const interval = setInterval((): void => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return (): void => {
        clearInterval(interval);
      };
    }
    return undefined;
  }, [isOpen, exam, submitting, result, startTime]);

  // Generate exam when modal opens
  useEffect((): undefined => {
    if (isOpen && exam == null && !generating) {
      generateExam().catch((error: unknown): void => {
        console.error('Error generating exam:', error);
      });
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const generateExam = async (): Promise<void> => {
    try {
      setGenerating(true);
      const res = await apiService.startModuleFinalExam({
        moduleId,
        pathId,
        objectiveId,
      });

      if (res.success === true && res.data != null) {
        const examData = res.data as unknown as ModuleFinalExam;
        setExam(examData);
        setCurrentQuestionIndex(0);
        setAnswers(new Map());
        setTimeSpent(0);
        setResult(null);
      } else {
        const errorMessage =
          res.error?.message != null && res.error.message !== ''
            ? res.error.message
            : 'Failed to start exam';
        toast.error(errorMessage);
        onClose();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg: string = error.response?.data?.message ?? 'Failed to start exam';
      toast.error(msg);
      onClose();
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (answer: string | number): void => {
    if (exam == null) {
      return;
    }
    const currentQuestion = exam.questions[currentQuestionIndex];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (currentQuestion == null) {
      return;
    }
    setAnswers((prev): Map<string, string | number> => {
      const newAnswers = new Map(prev);
      newAnswers.set(currentQuestion.id, answer);
      return newAnswers;
    });
  };

  const handleNext = (): void => {
    if (exam == null) {
      return;
    }
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (exam == null) {
      return;
    }

    // Check if all questions are answered
    if (answers.size < exam.questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    try {
      setSubmitting(true);
      const answersArray = Array.from(answers.entries()).map(([questionId, selectedAnswer]): { questionId: string; selectedAnswer: string | number } => ({
        questionId,
        selectedAnswer,
      }));

      const res = await apiService.submitModuleFinalExam(exam.id, answersArray, timeSpent);

      if (res.success === true && res.data != null) {
        const resultData = res.data as unknown as ModuleFinalExamResult;
        setResult(resultData);
        if (resultData.passed === true) {
          toast.success('Congratulations! You passed the final exam.');
          onComplete();
        } else {
          toast.error(`Score: ${resultData.score}%. You need at least 80% to pass.`);
        }
      } else {
        const errorMessage =
          res.error?.message != null && res.error.message !== ''
            ? res.error.message
            : 'Failed to submit exam';
        toast.error(errorMessage);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg: string = error.response?.data?.message ?? 'Failed to submit exam';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  if (generating) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Generating final exam...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result != null) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Final Exam Results</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <QuizResults result={result} onClose={onClose} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (exam == null) {
    return null;
  }

  const currentQuestion: QuizQuestion | undefined = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const selectedAnswer = currentQuestion != null ? answers.get(currentQuestion.id) : undefined;
  const allAnswered = answers.size === exam.questions.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Final Exam - {moduleTitle}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
              </span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
          {currentQuestion != null && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index): JSX.Element => (
                    <button
                      key={index}
                      onClick={(): void => {
                        handleAnswer(index);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                        selectedAnswer === index
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                {currentQuestionIndex === exam.questions.length - 1 ? (
                  <Button onClick={handleSubmit} disabled={!allAnswered || submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Exam'
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext}>Next</Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

