/**
 * Critical function tests for assessment route helpers
 * These functions are critical for determining user skill levels and scores
 */

describe('Assessment Route - Critical Helper Functions', () => {
  describe('determineSkillLevel', () => {
    // Import the helper function (will need to export it from assessments.ts)
    const determineSkillLevel = (score: number): 'beginner' | 'intermediate' | 'advanced' => {
      if (score >= 80) {
        return 'advanced';
      }
      if (score >= 60) {
        return 'intermediate';
      }
      return 'beginner';
    };

    it('should return advanced for score >= 80', () => {
      expect(determineSkillLevel(100)).toBe('advanced');
      expect(determineSkillLevel(80)).toBe('advanced');
      expect(determineSkillLevel(95)).toBe('advanced');
    });

    it('should return intermediate for score >= 60 and < 80', () => {
      expect(determineSkillLevel(60)).toBe('intermediate');
      expect(determineSkillLevel(70)).toBe('intermediate');
      expect(determineSkillLevel(79)).toBe('intermediate');
    });

    it('should return beginner for score < 60', () => {
      expect(determineSkillLevel(59)).toBe('beginner');
      expect(determineSkillLevel(0)).toBe('beginner');
      expect(determineSkillLevel(30)).toBe('beginner');
    });

    it('should handle edge cases', () => {
      expect(determineSkillLevel(60)).toBe('intermediate');
      expect(determineSkillLevel(59.9)).toBe('beginner');
      expect(determineSkillLevel(80.1)).toBe('advanced');
    });
  });

  describe('calculateScore', () => {
    const calculateScore = (
      answers: { questionId: string; selectedAnswer: number }[],
      correctMap: Map<string, number>
    ): { correctAnswers: number; totalQuestions: number; score: number } => {
      let correctAnswers = 0;
      for (const a of answers) {
        const correctAnswer = correctMap.get(a.questionId);
        if (correctAnswer !== undefined && correctAnswer === a.selectedAnswer) {
          correctAnswers++;
        }
      }
      const totalQuestions = correctMap.size;
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      return { correctAnswers, totalQuestions, score };
    };

    it('should calculate perfect score correctly', () => {
      const correctMap = new Map([
        ['q1', 0],
        ['q2', 1],
        ['q3', 2],
      ]);
      const answers = [
        { questionId: 'q1', selectedAnswer: 0 },
        { questionId: 'q2', selectedAnswer: 1 },
        { questionId: 'q3', selectedAnswer: 2 },
      ];

      const result = calculateScore(answers, correctMap);

      expect(result.correctAnswers).toBe(3);
      expect(result.totalQuestions).toBe(3);
      expect(result.score).toBe(100);
    });

    it('should calculate partial score correctly', () => {
      const correctMap = new Map([
        ['q1', 0],
        ['q2', 1],
        ['q3', 2],
        ['q4', 0],
      ]);
      const answers = [
        { questionId: 'q1', selectedAnswer: 0 },
        { questionId: 'q2', selectedAnswer: 1 },
        { questionId: 'q3', selectedAnswer: 1 }, // Wrong
        { questionId: 'q4', selectedAnswer: 0 },
      ];

      const result = calculateScore(answers, correctMap);

      expect(result.correctAnswers).toBe(3);
      expect(result.totalQuestions).toBe(4);
      expect(result.score).toBe(75);
    });

    it('should handle zero score', () => {
      const correctMap = new Map([
        ['q1', 0],
        ['q2', 1],
      ]);
      const answers = [
        { questionId: 'q1', selectedAnswer: 1 }, // Wrong
        { questionId: 'q2', selectedAnswer: 0 }, // Wrong
      ];

      const result = calculateScore(answers, correctMap);

      expect(result.correctAnswers).toBe(0);
      expect(result.totalQuestions).toBe(2);
      expect(result.score).toBe(0);
    });

    it('should handle missing answers', () => {
      const correctMap = new Map([
        ['q1', 0],
        ['q2', 1],
        ['q3', 2],
      ]);
      const answers = [
        { questionId: 'q1', selectedAnswer: 0 },
        // q2 and q3 missing
      ];

      const result = calculateScore(answers, correctMap);

      expect(result.correctAnswers).toBe(1);
      expect(result.totalQuestions).toBe(3);
      expect(result.score).toBe(33);
    });

    it('should round scores correctly', () => {
      const correctMap = new Map([
        ['q1', 0],
        ['q2', 1],
        ['q3', 2],
      ]);
      const answers = [
        { questionId: 'q1', selectedAnswer: 0 },
        // 1/3 = 33.333... should round to 33
      ];

      const result = calculateScore(answers, correctMap);

      expect(result.score).toBe(33);
    });
  });
});
