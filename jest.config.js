module.exports = {
  ...require('./node_modules/@connectedcars/setup/jest.config.js'),
  collectCoverageFrom: [
    '**/*.ts',
    '!src/index.ts',
    '!**/node_modules/**',
    '!**/types/**',
    '!**/src/test/**',
    '!**/src/**.test.ts',
    '!**/bin/**.test.ts',
    '!**/src/bin/**.ts',
    '!**/src/bin/**.test.ts'
  ],
  roots: ['<rootDir>/src']
}
