import { GoogleGenAI } from '@google/genai';
import { logger } from '@/utils/logger';
import { Flashcard, QuizQuestion } from '@/types';

class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    try {
      this.genAI = new GoogleGenAI({
        apiKey: 'AIzaSyAX8NG76dIXq44CS6PH_n7TtqWcrxFYbts', // TEMPORARY: Hardcoded for development
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

  async generateAssessment(
    objective: {
      title: string;
      description: string;
      category: string;
      targetRole: string;
      currentLevel: string;
      targetLevel: string;
    },
    count: number = 25
  ): Promise<QuizQuestion[]> {
    try {
      const prompt = this.buildAssessmentPrompt(objective, count);
      const response = await this.callGeminiAPI(prompt);

      return this.parseQuizQuestionsFromResponse(response);
    } catch (error) {
      logger.error('Error generating assessment:', error);
      throw error;
    }
  }

  async generateLearningPaths(
    objective: {
      title: string;
      description: string;
      category: string;
      targetRole: string;
      currentLevel: string;
      targetLevel: string;
    },
    count: number = 3
  ): Promise<
    Array<{
      title: string;
      description: string;
      category: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      estimatedDuration: number;
      prerequisites: string[];
      skills: string[];
    }>
  > {
    try {
      logger.info('Building learning paths prompt...');
      const prompt = this.buildLearningPathsPrompt(objective, count);
      logger.info('Calling Gemini API for learning paths...');
      const response = await this.callGeminiAPI(prompt);
      logger.info('Gemini API response received, length:', response.length);
      if (response.length > 0) {
        logger.debug('Raw Gemini response (first 500 chars):', response.substring(0, 500));
      } else {
        logger.warn('Gemini API returned empty response');
      }
      const parsed = this.parseLearningPathsFromResponse(response);
      logger.info(`Successfully parsed ${parsed.length} learning paths`);
      return parsed;
    } catch (error) {
      logger.error('Error in generateLearningPaths:', error);
      logger.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async generatePathModules(
    objective: {
      title: string;
      category: string;
      targetRole: string;
    },
    pathTitle: string,
    count: number = 4
  ): Promise<
    Array<{
      title: string;
      description: string;
      type: 'theory' | 'practice' | 'project' | 'assessment';
      duration: number;
    }>
  > {
    const prompt = this.buildModulesPrompt(objective, pathTitle, count);
    const response = await this.callGeminiAPI(prompt);
    return this.parseModulesFromResponse(response);
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      logger.debug('Calling Gemini API with prompt length:', prompt.length);
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const text = response.text || '';
      logger.debug('Gemini API response length:', text.length);
      if (!text) {
        logger.warn('Gemini API returned empty response');
      }
      return text;
    } catch (error) {
      logger.error('Error calling Gemini API:', error);
      if (error instanceof Error) {
        logger.error('Error message:', error.message);
        logger.error('Error stack:', error.stack);
      }
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

  private buildAssessmentPrompt(
    objective: {
      title: string;
      description: string;
      category: string;
      targetRole: string;
      currentLevel: string;
      targetLevel: string;
    },
    count: number
  ): string {
    return `
Generate ${count} interview-style multiple-choice questions to precisely evaluate the user's level.

Objective Details:
- Title: ${objective.title}
- Description: ${objective.description}
- Category: ${objective.category}
- Target Role: ${objective.targetRole}
- Current Level: ${objective.currentLevel}
- Target Level: ${objective.targetLevel}

Create questions that:
1. Mirror real interview scenarios for a ${objective.targetRole}
2. Cover skills needed to progress from ${objective.currentLevel} to ${objective.targetLevel}
3. Are practical, job-relevant, and unambiguous
4. Include realistic pitfalls, not trick questions
5. Vary in difficulty and scope (frameworks, core, tooling, performance, testing)

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
      "skills": ["skill1", "skill2"],
      "usageExample": "In practice, this means..."
    }
  ]
}

STRICT INSTRUCTIONS:
- Respond ONLY with valid JSON, no prose, no markdown, no code fences.
- Ensure the top-level object has a "questions" array exactly as specified.
- Do not include trailing commas.

Make questions specific to ${objective.category} and relevant for ${objective.targetRole} role.
        `.trim();
  }

  private buildLearningPathsPrompt(
    objective: {
      title: string;
      description: string;
      category: string;
      targetRole: string;
      currentLevel: string;
      targetLevel: string;
    },
    count: number
  ): string {
    return `
Generate ${count} learning paths for this objective, tailored to interview-level preparation.

Objective:
- Title: ${objective.title}
- Description: ${objective.description}
- Category: ${objective.category}
- Target Role: ${objective.targetRole}
- Current Level: ${objective.currentLevel}
- Target Level: ${objective.targetLevel}

Each path should include:
- title (string)
- description (string)
- category (string)
- difficulty (beginner|intermediate|advanced)
- estimatedDuration (number, weeks)
- prerequisites (string[])
- skills (string[])

Respond ONLY with JSON in this format:
{ "paths": [ { "title": "...", "description": "...", "category": "...", "difficulty": "beginner|intermediate|advanced", "estimatedDuration": 6, "prerequisites": ["..."], "skills": ["..."] } ] }
`.trim();
  }

  private buildModulesPrompt(
    objective: { title: string; category: string; targetRole: string },
    pathTitle: string,
    count: number
  ): string {
    return `
Generate ${count} modules for the learning path "${pathTitle}" toward ${objective.targetRole}.
Mix theory, practice, project, assessment types.
Return fields per module: title, description, type (theory|practice|project|assessment), duration (hours).

Respond ONLY with JSON in this format:
{ "modules": [ { "title": "...", "description": "...", "type": "theory|practice|project|assessment", "duration": 6 } ] }
`.trim();
  }

  private parseFlashcardsFromResponse(response: string): Flashcard[] {
    try {
      logger.debug('Parsing flashcards from response, length:', response.length);
      logger.debug('Raw response (first 500 chars):', response.substring(0, 500));

      const cleaned = this.normalizeJson(response);
      logger.debug('Cleaned JSON (first 500 chars):', cleaned.substring(0, 500));

      const parsed = this.safeParse<any>(cleaned);

      if (!parsed) {
        logger.error(
          'Failed to parse JSON. Cleaned response (first 1000 chars):',
          cleaned.substring(0, 1000)
        );
        throw new Error('Failed to parse JSON from AI response');
      }

      if (!Array.isArray(parsed.flashcards)) {
        logger.error('parsed.flashcards is not an array. Parsed object keys:', Object.keys(parsed));
        logger.error(
          'Parsed object (first 1000 chars):',
          JSON.stringify(parsed).substring(0, 1000)
        );

        // Essayer de trouver flashcards dans d'autres clés possibles
        const flashcardsKey = Object.keys(parsed).find(
          key =>
            key.toLowerCase().includes('flashcard') ||
            (Array.isArray(parsed[key]) && parsed[key].length > 0 && parsed[key][0]?.question)
        );

        if (flashcardsKey && Array.isArray(parsed[flashcardsKey])) {
          logger.info(`Found flashcards under key: ${flashcardsKey}`);
          parsed.flashcards = parsed[flashcardsKey];
        } else {
          throw new Error(
            `Flashcards array not found in response. Found keys: ${Object.keys(parsed).join(', ')}`
          );
        }
      }

      if (parsed.flashcards.length === 0) {
        logger.warn('Flashcards array is empty');
        throw new Error('No flashcards found in AI response');
      }

      logger.info(`Successfully parsed ${parsed.flashcards.length} flashcards`);

      return parsed.flashcards.map((card: any, index: number) => {
        if (!card.question || !card.answer) {
          logger.warn(`Flashcard at index ${index} missing question or answer:`, card);
        }
        return {
          id: `generated_${Date.now()}_${index}`,
          question: card.question || 'Question missing',
          answer: card.answer || 'Answer missing',
          explanation: card.explanation || undefined,
          difficulty: card.difficulty || 'medium',
          category: card.category || 'general',
          tags: card.tags || [],
          createdAt: new Date().toISOString(),
          reviewCount: 0,
          masteryLevel: 0,
        };
      });
    } catch (error) {
      logger.error('Error parsing flashcards:', error);
      if (error instanceof Error) {
        logger.error('Error message:', error.message);
      }
      throw error;
    }
  }

  private parseQuizQuestionsFromResponse(response: string): QuizQuestion[] {
    const normalize = (raw: string): string => {
      // Extract JSON inside code fences if present
      const codeFenceMatch = raw.match(/```(?:json)?\n([\s\S]*?)```/i);
      if (codeFenceMatch && codeFenceMatch[1]) return codeFenceMatch[1].trim();

      // If extra prose exists, try to find the first '{' and last '}'
      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return raw.slice(firstBrace, lastBrace + 1);
      }
      return raw.trim();
    };

    const tryParse = (raw: string): any | null => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    const cleaned = normalize(response);
    let parsed = tryParse(cleaned);

    if (!parsed) {
      // Try to coerce common issues: single quotes → double quotes
      const coerced = cleaned.replace(/'([^']*)'/g, '"$1"');
      parsed = tryParse(coerced);
    }

    if (!parsed || !Array.isArray(parsed.questions)) {
      logger.error(
        'Gemini response JSON parse failed. Raw response sample:',
        cleaned.slice(0, 400)
      );
      throw new Error('Failed to parse quiz questions from AI response');
    }

    return parsed.questions.map((q: any, index: number) => ({
      id: `quiz_${Date.now()}_${index}`,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || 'medium',
      category: q.category || 'general',
      usageExample: q.usageExample,
      skills: q.skills || [],
    }));
  }

  private normalizeJson(raw: string): string {
    const codeFenceMatch = raw.match(/```(?:json)?\n([\s\S]*?)```/i);
    if (codeFenceMatch && codeFenceMatch[1]) return codeFenceMatch[1].trim();
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return raw.slice(firstBrace, lastBrace + 1);
    }
    return raw.trim();
  }

  private safeParse<T = any>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      try {
        const coerced = raw.replace(/'([^']*)'/g, '"$1"');
        return JSON.parse(coerced) as T;
      } catch {
        return null;
      }
    }
  }

  private parseLearningPathsFromResponse(response: string): Array<{
    title: string;
    description: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number;
    prerequisites: string[];
    skills: string[];
  }> {
    logger.info('Parsing learning paths response...');
    const cleaned = this.normalizeJson(response);
    logger.debug('Cleaned JSON (first 500 chars):', cleaned.substring(0, 500));
    const parsed = this.safeParse<any>(cleaned);

    if (!parsed) {
      logger.error(
        'Failed to parse JSON. Cleaned response (first 1000 chars):',
        cleaned.substring(0, 1000)
      );
      throw new Error('Failed to parse learning paths JSON - invalid JSON format');
    }

    if (!Array.isArray(parsed.paths)) {
      logger.error(
        'Parsed JSON does not contain paths array. Parsed object keys:',
        Object.keys(parsed)
      );
      logger.error(
        'Full parsed object (first 1000 chars):',
        JSON.stringify(parsed, null, 2).substring(0, 1000)
      );
      throw new Error(
        `Failed to parse learning paths - expected 'paths' array, got keys: ${Object.keys(
          parsed
        ).join(', ')}`
      );
    }

    logger.info(`Found ${parsed.paths.length} paths in response`);
    return parsed.paths.map((p: any) => ({
      title: p.title || 'Untitled Path',
      description: p.description || '',
      category: p.category || 'general',
      difficulty: (p.difficulty || 'intermediate') as 'beginner' | 'intermediate' | 'advanced',
      estimatedDuration: Number(p.estimatedDuration) || 6,
      prerequisites: Array.isArray(p.prerequisites) ? p.prerequisites : [],
      skills: Array.isArray(p.skills) ? p.skills : [],
    }));
  }

  private parseModulesFromResponse(response: string): Array<{
    title: string;
    description: string;
    type: 'theory' | 'practice' | 'project' | 'assessment';
    duration: number;
  }> {
    const cleaned = this.normalizeJson(response);
    const parsed = this.safeParse<any>(cleaned);
    if (!parsed || !Array.isArray(parsed.modules)) {
      logger.error('Failed to parse modules JSON:', cleaned.slice(0, 400));
      throw new Error('Failed to parse modules from AI response');
    }
    return parsed.modules.map((m: any) => ({
      title: m.title,
      description: m.description,
      type: m.type || 'theory',
      duration: Number(m.duration) || 4,
    }));
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

  // Generate flashcards for a learning module
  async generateModuleFlashcards(
    module: {
      title: string;
      description: string;
      type: 'theory' | 'practice' | 'project' | 'assessment';
      duration: number;
    },
    context: {
      objectiveTitle: string;
      objectiveCategory: string;
      targetRole: string;
      pathTitle: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }
  ): Promise<Flashcard[]> {
    try {
      logger.info(`Generating flashcards for module: ${module.title} (type: ${module.type})`);
      const count = Math.max(15, Math.min(20, Math.ceil(module.duration * 3))); // 15-20 flashcards based on duration
      const prompt = this.buildModuleFlashcardPrompt(module, context, count);
      logger.debug('Calling Gemini API for module flashcards...');
      const response = await this.callGeminiAPI(prompt);
      logger.info('Gemini API response received, length:', response.length);
      if (response.length > 0) {
        logger.debug('Raw Gemini response (first 1000 chars):', response.substring(0, 1000));
      } else {
        logger.warn('Gemini API returned empty response for flashcards');
      }
      const parsed = this.parseFlashcardsFromResponse(response);
      logger.info(`Successfully generated ${parsed.length} flashcards for module ${module.title}`);
      return parsed;
    } catch (error) {
      logger.error('Error generating module flashcards:', error);
      if (error instanceof Error) {
        logger.error('Error message:', error.message);
        logger.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  private buildModuleFlashcardPrompt(
    module: {
      title: string;
      description: string;
      type: 'theory' | 'practice' | 'project' | 'assessment';
      duration: number;
    },
    context: {
      objectiveTitle: string;
      objectiveCategory: string;
      targetRole: string;
      pathTitle: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    },
    count: number
  ): string {
    return `
Generate ${count} educational flashcards for a learning module titled "${module.title}".

Module Context:
- Objective: ${context.objectiveTitle} (${context.objectiveCategory})
- Target Role: ${context.targetRole}
- Learning Path: ${context.pathTitle}
- Difficulty Level: ${context.difficulty}
- Module Type: ${module.type}
- Module Duration: ${module.duration} hours
- Module Description: ${module.description}

For each flashcard, provide:
1. A clear, concise question that tests understanding of key concepts from this module
2. A detailed, accurate answer that explains the concept
3. An optional explanation for better understanding
4. A difficulty level (easy, medium, hard) appropriate for ${context.difficulty} level
5. Relevant tags/categories related to the module topic

Focus on:
- Core concepts and principles covered in this module
- Practical applications relevant to ${context.targetRole}
- Real-world scenarios and examples
- Best practices and common pitfalls

STRICT INSTRUCTIONS:
- Respond ONLY with valid JSON, no prose, no markdown, no code fences.
- Ensure the top-level object has a "flashcards" array exactly as specified below.
- Do not include trailing commas.
- All string values must be properly escaped.

Format the response as JSON:
{
  "flashcards": [
    {
      "question": "What is...?",
      "answer": "The answer is...",
      "explanation": "This means...",
      "difficulty": "easy|medium|hard",
      "category": "${context.objectiveCategory}",
      "tags": ["tag1", "tag2", "${module.type}"]
    }
  ]
}

Return ONLY the JSON object above. Do not include any text before or after the JSON.
Make sure the content is accurate, educational, and appropriate for ${context.difficulty} level learners working toward ${context.targetRole}.
`.trim();
  }

  // Generate validation quiz for a module
  async generateModuleValidationQuiz(
    module: {
      title: string;
      description: string;
      type: 'theory' | 'practice' | 'project' | 'assessment';
    },
    flashcards: Flashcard[],
    context: {
      objectiveTitle: string;
      objectiveCategory: string;
      targetRole: string;
      pathTitle: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }
  ): Promise<QuizQuestion[]> {
    try {
      logger.info(`Generating validation quiz for module: ${module.title}`);
      const count = Math.max(10, Math.min(15, flashcards.length / 2)); // 10-15 questions based on flashcards count
      const prompt = this.buildModuleValidationQuizPrompt(module, flashcards, context, count);
      const response = await this.callGeminiAPI(prompt);
      const parsed = this.parseQuizQuestionsFromResponse(response);
      logger.info(
        `Successfully generated ${parsed.length} validation quiz questions for module ${module.title}`
      );
      return parsed;
    } catch (error) {
      logger.error('Error generating module validation quiz:', error);
      throw error;
    }
  }

  private buildModuleValidationQuizPrompt(
    module: {
      title: string;
      description: string;
      type: 'theory' | 'practice' | 'project' | 'assessment';
    },
    flashcards: Flashcard[],
    context: {
      objectiveTitle: string;
      objectiveCategory: string;
      targetRole: string;
      pathTitle: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    },
    count: number
  ): string {
    const flashcardTopics = flashcards
      .slice(0, 10)
      .map((fc, i) => `${i + 1}. ${fc.question}`)
      .join('\n');

    return `
Generate ${count} interview-style validation quiz questions to test comprehensive understanding of the module "${module.title}".

Module Context:
- Objective: ${context.objectiveTitle} (${context.objectiveCategory})
- Target Role: ${context.targetRole}
- Learning Path: ${context.pathTitle}
- Difficulty Level: ${context.difficulty}
- Module Type: ${module.type}
- Module Description: ${module.description}

The learner has already studied these flashcards:
${flashcardTopics}

Create questions that:
- Test deep understanding, not just memorization
- Assess ability to apply concepts in ${context.targetRole} context
- Include practical scenarios and problem-solving
- Are interview-style questions appropriate for ${context.difficulty} level
- Cover the key concepts from the flashcards above

For each question, provide:
1. A clear, comprehensive question
2. Four answer options (A, B, C, D) with plausible distractors
3. The correct answer (0-3 index)
4. A detailed explanation
5. A difficulty level appropriate for ${context.difficulty}
6. Relevant skills/tags
7. A practical usage example

Format the response as JSON:
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "The correct answer is... because...",
      "difficulty": "easy|medium|hard",
      "category": "${context.objectiveCategory}",
      "skills": ["skill1", "skill2"],
      "usageExample": "In practice, this means..."
    }
  ]
}

Ensure questions are challenging but fair for ${context.difficulty} level and validate comprehensive understanding.
`.trim();
  }

  // Generate suggested official resources for a module
  async generateSuggestedResources(
    module: {
      title: string;
      description: string;
      type: 'theory' | 'practice' | 'project' | 'assessment';
    },
    context: {
      objectiveTitle: string;
      objectiveCategory: string;
      targetRole: string;
      pathTitle: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }
  ): Promise<
    Array<{
      id: string;
      type: 'documentation' | 'book' | 'article' | 'video' | 'tutorial' | 'official_guide';
      title: string;
      description: string;
      url?: string;
      author?: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      estimatedTime: number;
      priority: number;
      isOptional: boolean;
    }>
  > {
    try {
      logger.info(`Generating suggested resources for module: ${module.title}`);
      const prompt = this.buildSuggestedResourcesPrompt(module, context);
      const response = await this.callGeminiAPI(prompt);
      const parsed = this.parseSuggestedResourcesFromResponse(response);
      logger.info(
        `Successfully generated ${parsed.length} suggested resources for module ${module.title}`
      );
      return parsed;
    } catch (error) {
      logger.error('Error generating suggested resources:', error);
      throw error;
    }
  }

  private buildSuggestedResourcesPrompt(
    module: {
      title: string;
      description: string;
      type: 'theory' | 'practice' | 'project' | 'assessment';
    },
    context: {
      objectiveTitle: string;
      objectiveCategory: string;
      targetRole: string;
      pathTitle: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }
  ): string {
    return `
Generate 3-5 official, authoritative learning resources for a module titled "${module.title}".

Module Context:
- Objective: ${context.objectiveTitle} (${context.objectiveCategory})
- Target Role: ${context.targetRole}
- Learning Path: ${context.pathTitle}
- Difficulty Level: ${context.difficulty}
- Module Type: ${module.type}
- Module Description: ${module.description}

Prioritize:
1. Official documentation (e.g., Oracle docs, MDN, React docs, Java official docs)
2. Well-known books by recognized authors in the field
3. Official tutorials and guides from authoritative sources
4. Respected articles from official sources or recognized publications
5. Video courses from official channels or reputable educational platforms

For each resource, include:
- Type: documentation|book|article|video|tutorial|official_guide
- Title
- Description explaining why it's relevant to this module
- URL (if available and official/free)
- Author (for books/articles)
- Difficulty level (beginner|intermediate|advanced)
- Estimated reading/watching time in minutes
- Priority (1-5, where 1 is highest priority)
- isOptional (false for essential resources, true for supplementary)

Avoid:
- Random blog posts from unknown sources
- Non-official tutorials
- Outdated resources
- Paid resources (unless free tier is available)

Format the response as JSON:
{
  "resources": [
    {
      "type": "documentation",
      "title": "Official Java Concurrency Guide",
      "description": "Comprehensive official documentation covering...",
      "url": "https://docs.oracle.com/javase/tutorial/essential/concurrency/",
      "author": "Oracle",
      "difficulty": "intermediate",
      "estimatedTime": 45,
      "priority": 1,
      "isOptional": false
    }
  ]
}

Ensure resources are:
- Relevant to ${context.targetRole} role
- Appropriate for ${context.difficulty} level
- Official, authoritative, and up-to-date
- Aligned with module objectives
`.trim();
  }

  private parseSuggestedResourcesFromResponse(response: string): Array<{
    id: string;
    type: 'documentation' | 'book' | 'article' | 'video' | 'tutorial' | 'official_guide';
    title: string;
    description: string;
    url?: string;
    author?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
    priority: number;
    isOptional: boolean;
  }> {
    const cleaned = this.normalizeJson(response);
    const parsed = this.safeParse<any>(cleaned);

    if (!parsed || !Array.isArray(parsed.resources)) {
      logger.error('Failed to parse suggested resources JSON:', cleaned.slice(0, 400));
      throw new Error('Failed to parse suggested resources from AI response');
    }

    return parsed.resources.map((item: any, index: number) => ({
      id: `resource_${Date.now()}_${index}`,
      type: (item.type || 'documentation') as
        | 'documentation'
        | 'book'
        | 'article'
        | 'video'
        | 'tutorial'
        | 'official_guide',
      title: item.title || 'Untitled Resource',
      description: item.description || '',
      url: item.url,
      author: item.author,
      difficulty: (item.difficulty || 'intermediate') as 'beginner' | 'intermediate' | 'advanced',
      estimatedTime: Number(item.estimatedTime) || 30,
      priority: Number(item.priority) || 3,
      isOptional: Boolean(item.isOptional),
    }));
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
