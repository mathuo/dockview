const { name } = require('./package');

const baseConfig = require('../../jest.config.base');

console.log('loaded');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/packages/dockview-core'],
    modulePaths: ['<rootDir>/packages/dockview-core/src'],
    displayName: { name, color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview-core/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [
        '<rootDir>/packages/dockview-core/src/__tests__/__mocks__/resizeObserver.js',
    ],
    coveragePathIgnorePatterns: ['/node_modules/'],
    modulePathIgnorePatterns: [
        '<rootDir>/packages/dockview-core/src/__tests__/__mocks__',
        '<rootDir>/packages/dockview-core/src/__tests__/__test_utils__',
    ],
    coverageDirectory: '<rootDir>/packages/dockview-core/coverage/',
    testResultsProcessor: 'jest-sonar-reporter',
    testEnvironment: 'jsdom',
};
