import { GoogleGenAI } from '@google/genai';
import { logger } from '@/utils/logger';
import { GeminiRequest, GeminiResponse, Flashcard, QuizQuestion } from '@/types';

class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    try {
      this.genAI = new GoogleGenAI({
        apiKey: 'AIzaSyAX8NG76dIXq44CS6PH_n7TtqWcrxFYbts',
      });
      logger.info('Gemini AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Gemini AI service:', error);
      throw error;
    }
  }

  async generateFlashcards(
    topic: string,
    skillLevel: string,
    count: number = 10
  ): Promise<Flashcard[]> {
    try {
      const prompt = this.buildFlashcardPrompt(topic, skillLevel, count);
      const response = await this.callGeminiAPI(prompt);

      return this.parseFlashcardsFromResponse(response);
    } catch (error) {
      logger.error('Error generating flashcards:', error);
      throw error;
    }
  }

  async generateQuizQuestions(
    topic: string,
    skillLevel: string,
    count: number = 5
  ): Promise<QuizQuestion[]> {
    try {
      const prompt = this.buildQuizPrompt(topic, skillLevel, count);
      const response = await this.callGeminiAPI(prompt);

      return this.parseQuizQuestionsFromResponse(response);
    } catch (error) {
      logger.error('Error generating quiz questions:', error);
      throw error;
    }
  }

  async processDocument(
    content: string,
    topic?: string
  ): Promise<{ flashcards: Flashcard[]; topics: string[] }> {
    try {
      const prompt = this.buildDocumentProcessingPrompt(content, topic);
      const response = await this.callGeminiAPI(prompt);

      return this.parseDocumentProcessingResponse(response);
    } catch (error) {
      logger.error('Error processing document:', error);
      throw error;
    }
  }

  async generateAdaptiveQuestions(
    topic: string,
    userPerformance: any[],
    currentDifficulty: string
  ): Promise<QuizQuestion[]> {
    try {
      const prompt = this.buildAdaptivePrompt(topic, userPerformance, currentDifficulty);
      const response = await this.callGeminiAPI(prompt);

      return this.parseQuizQuestionsFromResponse(response);
    } catch (error) {
      logger.error('Error generating adaptive questions:', error);
      throw error;
    }
  }

  async generateExplanation(
    question: string,
    userAnswer: string,
    correctAnswer: string
  ): Promise<string> {
    try {
      const prompt = this.buildExplanationPrompt(question, userAnswer, correctAnswer);
      const response = await this.callGeminiAPI(prompt);

      return response.trim();
    } catch (error) {
      logger.error('Error generating explanation:', error);
      throw error;
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || '';
    } catch (error) {
      logger.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  private buildFlashcardPrompt(topic: string, skillLevel: string, count: number): string {
    return `
Generate ${count} educational flashcards about "${topic}" for a ${skillLevel} level learner.

For each flashcard, provide:
1. A clear, concise question
2. A detailed, accurate answer
3. An optional explanation for better understanding
4. A difficulty level (easy, medium, hard)
5. Relevant tags/categories

Format the response as JSON:
{
  "flashcards": [
    {
      "question": "What is...?",
      "answer": "The answer is...",
      "explanation": "This means...",
      "difficulty": "easy|medium|hard",
      "category": "category name",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Make sure the content is accurate, educational, and appropriate for the skill level.
        `.trim();
  }

  private buildQuizPrompt(topic: string, skillLevel: string, count: number): string {
    return `
Generate ${count} multiple-choice quiz questions about "${topic}" for a ${skillLevel} level learner.

For each question, provide:
1. A clear question
2. Four answer options (A, B, C, D)
3. The correct answer (0-3 index)
4. A detailed explanation
5. A difficulty level
6. A practical usage example (optional)

Format the response as JSON:
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "The correct answer is...",
      "difficulty": "easy|medium|hard",
      "category": "category name",
      "usageExample": "In practice, this means..."
    }
  ]
}

Ensure questions are challenging but fair for the skill level.
        `.trim();
  }

  private buildDocumentProcessingPrompt(content: string, topic?: string): string {
    return `
Analyze the following document content and extract key educational concepts to create flashcards.

Document content:
${content.substring(0, 4000)} // Limit content to avoid token limits

${topic ? `Focus on the topic: ${topic}` : 'Extract the main topics covered.'}

Generate flashcards that cover the most important concepts from this document.

Format the response as JSON:
{
  "topics": ["topic1", "topic2", "topic3"],
  "flashcards": [
    {
      "question": "What is...?",
      "answer": "The answer is...",
      "explanation": "This means...",
      "difficulty": "easy|medium|hard",
      "category": "category name",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Focus on the most important and educational concepts from the document.
        `.trim();
  }

  private buildAdaptivePrompt(
    topic: string,
    userPerformance: any[],
    currentDifficulty: string
  ): string {
    const performanceSummary = userPerformance
      .slice(-10) // Last 10 attempts
      .map(p => `Score: ${p.score}, Difficulty: ${p.difficulty}, Time: ${p.responseTime}s`)
      .join('\n');

    return `
Generate adaptive quiz questions about "${topic}" based on user performance.

Current difficulty level: ${currentDifficulty}
Recent performance:
${performanceSummary}

Adjust the difficulty based on performance:
- If user is scoring high (>80%), increase difficulty
- If user is scoring low (<60%), decrease difficulty
- If user is taking too long, simplify questions

Generate 3-5 questions that are appropriately challenging.

Format the response as JSON:
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "The correct answer is...",
      "difficulty": "easy|medium|hard",
      "category": "category name",
      "usageExample": "In practice, this means..."
    }
  ]
}
        `.trim();
  }

  private buildExplanationPrompt(
    question: string,
    userAnswer: string,
    correctAnswer: string
  ): string {
    return `
Provide a helpful explanation for this quiz question.

Question: ${question}
User's answer: ${userAnswer}
Correct answer: ${correctAnswer}

Provide:
1. Whether the user's answer was correct or incorrect
2. A clear explanation of why the correct answer is right
3. Additional context or tips to help the user understand better
4. A practical example if applicable

Keep the explanation encouraging and educational.
        `.trim();
  }

  private parseFlashcardsFromResponse(response: string): Flashcard[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.flashcards.map((card: any, index: number) => ({
        id: `generated_${Date.now()}_${index}`,
        question: card.question,
        answer: card.answer,
        explanation: card.explanation,
        difficulty: card.difficulty || 'medium',
        category: card.category || 'general',
        tags: card.tags || [],
        createdAt: new Date(),
        reviewCount: 0,
        masteryLevel: 0,
      }));
    } catch (error) {
      logger.error('Error parsing flashcards from Gemini response:', error);
      throw new Error('Failed to parse flashcards from AI response');
    }
  }

  private parseQuizQuestionsFromResponse(response: string): QuizQuestion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.questions.map((q: any, index: number) => ({
        id: `quiz_${Date.now()}_${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
        category: q.category || 'general',
        usageExample: q.usageExample,
      }));
    } catch (error) {
      logger.error('Error parsing quiz questions from Gemini response:', error);
      throw new Error('Failed to parse quiz questions from AI response');
    }
  }

  private parseDocumentProcessingResponse(response: string): {
    flashcards: Flashcard[];
    topics: string[];
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        topics: parsed.topics || [],
        flashcards: parsed.flashcards.map((card: any, index: number) => ({
          id: `doc_${Date.now()}_${index}`,
          question: card.question,
          answer: card.answer,
          explanation: card.explanation,
          difficulty: card.difficulty || 'medium',
          category: card.category || 'general',
          tags: card.tags || [],
          createdAt: new Date(),
          reviewCount: 0,
          masteryLevel: 0,
        })),
      };
    } catch (error) {
      logger.error('Error parsing document processing response:', error);
      throw new Error('Failed to parse document processing response');
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.callGeminiAPI('Hello, are you working?');
      return true;
    } catch (error) {
      logger.error('Gemini health check failed:', error);
      return false;
    }
  }
}

export const geminiService = new GeminiService();
export default geminiService;
