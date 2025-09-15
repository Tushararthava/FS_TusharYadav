import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from '@jest/globals';
import { server } from './mocks/server';

beforeAll(() => {
  // Enable API mocking
  server.listen();
});

afterEach(() => {
  // Reset handlers between tests
  server.resetHandlers();
});

afterAll(() => {
  // Clean up after tests
  server.close();
});