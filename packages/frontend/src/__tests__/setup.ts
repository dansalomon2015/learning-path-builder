// Vitest setup file
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach((): void => {
  cleanup();
});

// Mock environment variables
const mockMatchMedia = vi.fn().mockImplementation((query: string): MediaQueryList => {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as MediaQueryList;
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});
