// Jest setup file
// Mock environment variables for testing
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3001';
process.env['FIREBASE_PROJECT_ID'] = 'test-project';
process.env['GEMINI_API_KEY'] = 'test-api-key';

// Global test timeout
jest.setTimeout(10000);
