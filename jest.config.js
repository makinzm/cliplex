/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',     // ブラウザAPIを使わないユニットテストなら node でOK
  testMatch: ['**/tests/**/*.spec.ts', '**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/e2e/'],
};

