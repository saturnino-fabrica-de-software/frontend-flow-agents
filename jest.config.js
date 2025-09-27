module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/**/*.min.js',
    '!lib/**/vendor/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 10,
      lines: 5,
      statements: 5
    }
  },
  testTimeout: 10000,
  verbose: true
};