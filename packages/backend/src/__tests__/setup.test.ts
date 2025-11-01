// Jest setup test file - prevents "test suite must contain at least one test" error
describe('Setup', () => {
  it('should configure test environment', () => {
    expect(process.env['NODE_ENV']).toBe('test');
  });
});
