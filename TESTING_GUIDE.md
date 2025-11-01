# 🧪 Testing Guide - Critical Functions

This document outlines the testing strategy focused on **critical business logic functions** that ensure the core functionality of FlashLearn AI works correctly.

## 📋 Overview

Tests are organized by package and focus on **business-critical functions** that:
- Calculate scores and skill levels
- Determine adaptive difficulty
- Track learning progress
- Manage study sessions
- Calculate mastery levels

## 🎯 Test Coverage Focus

### Backend Tests (`packages/backend/src/**/__tests__/`)

#### 1. **Adaptive Learning Service** (`services/__tests__/adaptiveLearning.test.ts`)
Tests for:
- ✅ `calculateAdaptiveDifficulty` - Determines difficulty based on performance
- ✅ `updateFlashcardMastery` - Updates mastery levels with bounds checking
- ✅ `calculateLearningProgress` - Calculates overall progress metrics

**Critical Test Cases:**
- Default difficulty when no sessions exist
- Difficulty adjustment based on performance thresholds
- Mastery level bounds (0-100)
- Progress calculation with various mastery states

#### 2. **Assessment Routes** (`routes/__tests__/assessments-helpers.test.ts`)
Tests for:
- ✅ `determineSkillLevel` - Maps scores to skill levels (beginner/intermediate/advanced)
- ✅ `calculateScore` - Calculates assessment scores with proper rounding

**Critical Test Cases:**
- Edge cases at thresholds (60, 80)
- Perfect scores
- Zero scores
- Partial scores with rounding
- Missing answers

#### 3. **Objectives Routes** (`routes/__tests__/objectives.test.ts`)
Tests for:
- ✅ `calculateQuizScore` - Calculates quiz scores with feedback
- ✅ `calculateTrend` - Determines performance trends (progression/regression/stable)
- ✅ `calculateProgress` - Calculates completion progress

**Critical Test Cases:**
- Score calculation with different answer types (number/string)
- Trend detection at ±5% thresholds
- Progress calculation with completion states
- Feedback generation with explanations

### Frontend Tests (`packages/frontend/src/**/__tests__/`)

#### 1. **Session Service** (`services/__tests__/sessionService.test.ts`)
Tests for:
- ✅ `startSession` - Creates new study sessions
- ✅ `recordCardInteraction` - Tracks correct/incorrect answers
- ✅ `nextCard` - Advances through cards
- ✅ `completeSession` - Finalizes sessions and calculates stats
- ✅ `getSessionStats` - Calculates session statistics

**Critical Test Cases:**
- Session initialization with correct state
- Answer tracking accuracy
- Card index progression
- Statistics calculation

#### 2. **Module Flashcard Study** (`components/__tests__/ModuleFlashcardStudy.test.ts`)
Tests for:
- ✅ `calculateModuleMastery` - Calculates mastery percentage
- ✅ Mastery card tracking (add/remove from mastered set)

**Critical Test Cases:**
- Empty set handling (0%)
- Full mastery (100%)
- Partial mastery with rounding
- Card tracking logic

## 🚀 Running Tests

### Backend Tests
```bash
cd packages/backend
npm test
```

### Frontend Tests
```bash
cd packages/frontend
npm test
```

### All Tests
```bash
npm test  # From root
```

## 📊 Test Philosophy

### What We Test ✅
- **Business Logic Functions**: Score calculations, difficulty determination, progress tracking
- **Edge Cases**: Boundary conditions, empty inputs, division by zero
- **Data Integrity**: Bounds checking, type safety, rounding accuracy

### What We Don't Test (Yet) ❌
- UI component rendering (requires React Testing Library setup)
- API integration tests (requires mock servers)
- End-to-end flows (requires E2E framework)

## 🔧 Test Structure

Each test file follows this structure:

```typescript
describe('Service/Component - Critical Functions', () => {
  describe('functionName', () => {
    it('should handle normal case', () => {
      // Test implementation
    });

    it('should handle edge case', () => {
      // Edge case test
    });
  });
});
```

## 📈 Future Improvements

1. **Increase Coverage**: Add tests for more helper functions
2. **Integration Tests**: Test API routes with mocked Firebase/Gemini
3. **Component Tests**: Add React Testing Library for UI components
4. **E2E Tests**: Add Playwright/Cypress for critical user flows

## 🎯 Priority Functions to Test Next

1. **Backend**:
   - `geminiService` prompt building and parsing
   - `firebaseService` document operations
   - Route handlers for authentication

2. **Frontend**:
   - API service interceptors
   - Redux slice reducers
   - Complex component state management

## 📝 Notes

- Tests use **Jest** for backend (Node.js) and **Vitest** for frontend (Vite)
- TypeScript strict mode is enforced in tests
- Mock data follows the same structure as production types
- Tests focus on **pure functions** where possible for easier testing

---

**Last Updated**: 2024-11-01

