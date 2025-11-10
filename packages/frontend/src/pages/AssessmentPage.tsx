import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SkillAssessment from '../components/SkillAssessment';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';
import type { Assessment } from '../types';
import { Loader2 } from 'lucide-react';

export default function AssessmentPage(): JSX.Element | null {
  const { objectiveId } = useParams<{ objectiveId: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPaths, setGeneratingPaths] = useState(false);

  useEffect((): undefined => {
    const startAssessment = async (): Promise<void> => {
      if (objectiveId == null || objectiveId === '') {
        toast.error('Objective ID is required');
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        const res = await apiService.startAssessment({ objectiveId });
        if (res.success === true && res.data != null) {
          // Add objectiveId to assessment so SkillAssessment can use it
          const assessmentData = res.data as unknown as Assessment & { objectiveId?: string };
          assessmentData.objectiveId = objectiveId;
          setAssessment(assessmentData);
        } else {
          const errorMessage =
            res.error?.message != null && res.error.message !== ''
              ? res.error.message
              : 'Failed to start assessment';
          toast.error(errorMessage);
          navigate('/dashboard');
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        const msg: string = error.response?.data?.message ?? 'Failed to start assessment';
        toast.error(msg);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    startAssessment().catch((error: unknown): void => {
      console.error('Error starting assessment:', error);
    });
    return undefined;
  }, [objectiveId, navigate]);

  const handleComplete = (): void => {
    // Don't navigate immediately - let the result be displayed
    // Navigation will happen after learning paths are generated
  };

  const handleBack = (): void => {
    navigate('/dashboard');
  };

  const handleSubmitResult = async (
    assessmentId: string,
    answers: { questionId: string; selectedAnswer: number }[],
    timeSpentMinutes: number
  ): Promise<void> => {
    try {
      const res = await apiService.submitAssessment(assessmentId, answers, timeSpentMinutes);
      if (res.success === true) {
        toast.success('Assessment completed!');
        // Don't reload - let the result be displayed
      } else {
        const errorMessage =
          res.error?.message != null && res.error.message !== ''
            ? res.error.message
            : 'Failed to submit assessment';
        toast.error(errorMessage);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg: string = error.response?.data?.message ?? 'Failed to submit assessment';
      toast.error(msg);
    }
  };

  const handleSetupLearningPath = async (objId: string): Promise<void> => {
    if (generatingPaths) {
      return;
    }

    try {
      setGeneratingPaths(true);
      toast.loading("Generating learning paths...", { id: 'generating-paths' });

      const res = await apiService.generateLearningPaths(objId);
      if (res.success === true) {
        toast.success("Learning paths generated successfully!", { id: 'generating-paths' });

        // Get updated objective to find the first path
        const objectiveRes = await apiService.getObjective(objId);
        const objective = objectiveRes.data as unknown as { learningPaths?: Array<{ id: string }> };
        const paths = objective.learningPaths ?? [];

        if (paths.length > 0) {
          // Navigate to the list of paths
          navigate(`/objectives/${objId}/paths`);
        } else {
          // Fallback to dashboard if no paths were generated
          navigate('/dashboard');
        }
      } else {
        const errorMessage =
          res.error?.message != null && res.error.message !== ''
            ? res.error.message
            : 'Failed to generate learning paths';
        toast.error(errorMessage, { id: 'generating-paths' });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg: string = error.response?.data?.message ?? 'Failed to generate learning paths';
      toast.error(msg, { id: 'generating-paths' });
    } finally {
      setGeneratingPaths(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Preparing assessment...</p>
        </div>
      </div>
    );
  }

  if (assessment == null) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SkillAssessment
        assessment={assessment}
        onComplete={handleComplete}
        onBack={handleBack}
        onSubmitResult={handleSubmitResult}
        onSetupLearningPath={handleSetupLearningPath}
      />
      {generatingPaths && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating learning paths...</p>
          </div>
        </div>
      )}
    </div>
  );
}
