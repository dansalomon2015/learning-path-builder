import {
    AdaptiveAlgorithm,
    PerformanceMetric,
    StudySession,
    Flashcard,
} from "@/types";
import {logger} from "@/utils/logger";

class AdaptiveLearningService {
    private readonly DIFFICULTY_THRESHOLDS = {
        easy: {minScore: 0, maxScore: 60},
        medium: {minScore: 60, maxScore: 80},
        hard: {minScore: 80, maxScore: 100},
    };

    private readonly MASTERY_THRESHOLDS = {
        novice: 0,
        beginner: 25,
        intermediate: 50,
        advanced: 75,
        expert: 90,
    };

    async calculateAdaptiveDifficulty(
        userId: string,
        learningPlanId: string,
        recentSessions: StudySession[]
    ): Promise<"easy" | "medium" | "hard"> {
        try {
            if (recentSessions.length === 0) {
                return "medium"; // Default difficulty
            }

            const performanceMetrics =
                this.extractPerformanceMetrics(recentSessions);
            const averageScore = this.calculateAverageScore(performanceMetrics);
            const averageResponseTime =
                this.calculateAverageResponseTime(performanceMetrics);
            const consistencyScore =
                this.calculateConsistencyScore(performanceMetrics);

            // Determine difficulty based on performance
            let newDifficulty: "easy" | "medium" | "hard" = "medium";

            if (
                averageScore >= 85 &&
                averageResponseTime < 30 &&
                consistencyScore > 0.7
            ) {
                newDifficulty = "hard";
            } else if (
                averageScore < 60 ||
                averageResponseTime > 60 ||
                consistencyScore < 0.4
            ) {
                newDifficulty = "easy";
            }

            logger.info(
                `Adaptive difficulty calculated for user ${userId}: ${newDifficulty}`,
                {
                    averageScore,
                    averageResponseTime,
                    consistencyScore,
                    sessionCount: recentSessions.length,
                }
            );

            return newDifficulty;
        } catch (error) {
            logger.error("Error calculating adaptive difficulty:", error);
            return "medium"; // Fallback to medium difficulty
        }
    }

    async updateFlashcardMastery(
        flashcard: Flashcard,
        userResponse: "correct" | "incorrect",
        responseTime: number
    ): Promise<Flashcard> {
        try {
            const updatedFlashcard = {...flashcard};

            // Update review count
            updatedFlashcard.reviewCount += 1;
            updatedFlashcard.lastReviewed = new Date();

            // Calculate mastery level adjustment
            const masteryAdjustment = this.calculateMasteryAdjustment(
                userResponse,
                responseTime,
                flashcard.difficulty
            );

            // Update mastery level (0-100)
            updatedFlashcard.masteryLevel = Math.max(
                0,
                Math.min(100, flashcard.masteryLevel + masteryAdjustment)
            );

            // Calculate next review date using spaced repetition
            updatedFlashcard.nextReviewDate = this.calculateNextReviewDate(
                updatedFlashcard.masteryLevel,
                updatedFlashcard.reviewCount
            );

            logger.info(`Updated flashcard mastery: ${flashcard.id}`, {
                oldMastery: flashcard.masteryLevel,
                newMastery: updatedFlashcard.masteryLevel,
                adjustment: masteryAdjustment,
                userResponse,
                responseTime,
            });

            return updatedFlashcard;
        } catch (error) {
            logger.error("Error updating flashcard mastery:", error);
            return flashcard;
        }
    }

    async generatePersonalizedRecommendations(
        userId: string,
        learningPlanId: string,
        performanceHistory: PerformanceMetric[]
    ): Promise<string[]> {
        try {
            const recommendations: string[] = [];

            // Analyze weak areas
            const weakAreas = this.identifyWeakAreas(performanceHistory);
            if (weakAreas.length > 0) {
                recommendations.push(
                    `Focus on reviewing: ${weakAreas.join(
                        ", "
                    )}. Consider spending extra time on these topics.`
                );
            }

            // Analyze strong areas
            const strongAreas = this.identifyStrongAreas(performanceHistory);
            if (strongAreas.length > 0) {
                recommendations.push(
                    `Great job on: ${strongAreas.join(
                        ", "
                    )}. You can move to more advanced topics in these areas.`
                );
            }

            // Analyze study patterns
            const studyPatterns = this.analyzeStudyPatterns(performanceHistory);
            if (studyPatterns.needsMorePractice) {
                recommendations.push(
                    "Consider increasing your study frequency for better retention."
                );
            }

            if (studyPatterns.needsSlowerPace) {
                recommendations.push(
                    "Try slowing down and focusing on understanding rather than speed."
                );
            }

            // Analyze difficulty progression
            const difficultyProgression =
                this.analyzeDifficultyProgression(performanceHistory);
            if (difficultyProgression.shouldIncrease) {
                recommendations.push(
                    "You're ready for more challenging questions. The system will increase difficulty."
                );
            } else if (difficultyProgression.shouldDecrease) {
                recommendations.push(
                    "Let's focus on mastering the basics first. Difficulty will be adjusted."
                );
            }

            return recommendations;
        } catch (error) {
            logger.error(
                "Error generating personalized recommendations:",
                error
            );
            return [
                "Continue practicing regularly for optimal learning results.",
            ];
        }
    }

    async calculateLearningProgress(
        learningPlanId: string,
        flashcards: Flashcard[]
    ): Promise<{
        totalCards: number;
        masteredCards: number;
        inProgressCards: number;
        newCards: number;
        masteryPercentage: number;
        estimatedTimeToMastery: number; // in days
    }> {
        try {
            const totalCards = flashcards.length;
            const masteredCards = flashcards.filter(
                (card) => card.masteryLevel >= 80
            ).length;
            const inProgressCards = flashcards.filter(
                (card) => card.masteryLevel > 0 && card.masteryLevel < 80
            ).length;
            const newCards = flashcards.filter(
                (card) => card.masteryLevel === 0
            ).length;

            const masteryPercentage =
                totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;

            // Estimate time to mastery based on current progress
            const estimatedTimeToMastery =
                this.estimateTimeToMastery(flashcards);

            return {
                totalCards,
                masteredCards,
                inProgressCards,
                newCards,
                masteryPercentage: Math.round(masteryPercentage * 100) / 100,
                estimatedTimeToMastery,
            };
        } catch (error) {
            logger.error("Error calculating learning progress:", error);
            return {
                totalCards: 0,
                masteredCards: 0,
                inProgressCards: 0,
                newCards: 0,
                masteryPercentage: 0,
                estimatedTimeToMastery: 0,
            };
        }
    }

    private extractPerformanceMetrics(
        sessions: StudySession[]
    ): PerformanceMetric[] {
        return sessions.flatMap((session) =>
            session.performance.difficultyProgression.map(
                (difficulty, index) => ({
                    date: session.startTime,
                    score: session.score || 0,
                    responseTime: session.performance.averageResponseTime,
                    difficulty,
                    category: session.performance.weakAreas[index] || "general",
                })
            )
        );
    }

    private calculateAverageScore(metrics: PerformanceMetric[]): number {
        if (metrics.length === 0) return 0;
        return (
            metrics.reduce((sum, metric) => sum + metric.score, 0) /
            metrics.length
        );
    }

    private calculateAverageResponseTime(metrics: PerformanceMetric[]): number {
        if (metrics.length === 0) return 0;
        return (
            metrics.reduce((sum, metric) => sum + metric.responseTime, 0) /
            metrics.length
        );
    }

    private calculateConsistencyScore(metrics: PerformanceMetric[]): number {
        if (metrics.length < 2) return 1;

        const scores = metrics.map((m) => m.score);
        const mean =
            scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance =
            scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
            scores.length;
        const standardDeviation = Math.sqrt(variance);

        // Consistency score: 1 - (standard deviation / mean)
        return Math.max(0, 1 - standardDeviation / mean);
    }

    private calculateMasteryAdjustment(
        userResponse: "correct" | "incorrect",
        responseTime: number,
        difficulty: string
    ): number {
        const baseAdjustment = userResponse === "correct" ? 10 : -5;
        const timeBonus = responseTime < 30 ? 2 : responseTime > 60 ? -2 : 0;
        const difficultyMultiplier =
            difficulty === "hard" ? 1.5 : difficulty === "easy" ? 0.5 : 1;

        return Math.round((baseAdjustment + timeBonus) * difficultyMultiplier);
    }

    private calculateNextReviewDate(
        masteryLevel: number,
        reviewCount: number
    ): Date {
        const now = new Date();
        let daysUntilNextReview: number;

        if (masteryLevel >= 90) {
            daysUntilNextReview = 30; // Expert level: review monthly
        } else if (masteryLevel >= 75) {
            daysUntilNextReview = 14; // Advanced level: review bi-weekly
        } else if (masteryLevel >= 50) {
            daysUntilNextReview = 7; // Intermediate level: review weekly
        } else if (masteryLevel >= 25) {
            daysUntilNextReview = 3; // Beginner level: review every 3 days
        } else {
            daysUntilNextReview = 1; // Novice level: review daily
        }

        // Adjust based on review count (spaced repetition)
        const spacingMultiplier = Math.min(2, 1 + reviewCount * 0.1);
        daysUntilNextReview = Math.round(
            daysUntilNextReview * spacingMultiplier
        );

        return new Date(
            now.getTime() + daysUntilNextReview * 24 * 60 * 60 * 1000
        );
    }

    private identifyWeakAreas(metrics: PerformanceMetric[]): string[] {
        const categoryScores = new Map<string, number[]>();

        metrics.forEach((metric) => {
            if (!categoryScores.has(metric.category)) {
                categoryScores.set(metric.category, []);
            }
            categoryScores.get(metric.category)!.push(metric.score);
        });

        const weakAreas: string[] = [];
        categoryScores.forEach((scores, category) => {
            const averageScore =
                scores.reduce((sum, score) => sum + score, 0) / scores.length;
            if (averageScore < 60) {
                weakAreas.push(category);
            }
        });

        return weakAreas;
    }

    private identifyStrongAreas(metrics: PerformanceMetric[]): string[] {
        const categoryScores = new Map<string, number[]>();

        metrics.forEach((metric) => {
            if (!categoryScores.has(metric.category)) {
                categoryScores.set(metric.category, []);
            }
            categoryScores.get(metric.category)!.push(metric.score);
        });

        const strongAreas: string[] = [];
        categoryScores.forEach((scores, category) => {
            const averageScore =
                scores.reduce((sum, score) => sum + score, 0) / scores.length;
            if (averageScore >= 85) {
                strongAreas.push(category);
            }
        });

        return strongAreas;
    }

    private analyzeStudyPatterns(metrics: PerformanceMetric[]): {
        needsMorePractice: boolean;
        needsSlowerPace: boolean;
    } {
        const recentMetrics = metrics.slice(-10); // Last 10 sessions
        const averageScore = this.calculateAverageScore(recentMetrics);
        const averageResponseTime =
            this.calculateAverageResponseTime(recentMetrics);

        return {
            needsMorePractice: averageScore < 70,
            needsSlowerPace: averageResponseTime > 45,
        };
    }

    private analyzeDifficultyProgression(metrics: PerformanceMetric[]): {
        shouldIncrease: boolean;
        shouldDecrease: boolean;
    } {
        const recentMetrics = metrics.slice(-5); // Last 5 sessions
        const averageScore = this.calculateAverageScore(recentMetrics);
        const consistencyScore = this.calculateConsistencyScore(recentMetrics);

        return {
            shouldIncrease: averageScore >= 85 && consistencyScore > 0.7,
            shouldDecrease: averageScore < 60 || consistencyScore < 0.4,
        };
    }

    private estimateTimeToMastery(flashcards: Flashcard[]): number {
        const inProgressCards = flashcards.filter(
            (card) => card.masteryLevel > 0 && card.masteryLevel < 80
        );

        if (inProgressCards.length === 0) return 0;

        // Estimate based on current mastery levels and review frequency
        const averageMastery =
            inProgressCards.reduce((sum, card) => sum + card.masteryLevel, 0) /
            inProgressCards.length;
        const remainingMastery = 80 - averageMastery; // Target mastery level
        const averageProgressPerDay = 5; // Estimated mastery points gained per day

        return Math.ceil(remainingMastery / averageProgressPerDay);
    }
}

export const adaptiveLearningService = new AdaptiveLearningService();
export default adaptiveLearningService;
