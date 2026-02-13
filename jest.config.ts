import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    displayName: { name: 'root', color: 'blue' },
    projects: ['<rootDir>/packages/*/jest.config.ts'],
    collectCoverage: false, // Only collect when explicitly requested
    collectCoverageFrom: ['<rootDir>/packages/*/src/**/*.{js,jsx,ts,tsx}'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/packages/*/src/__tests__/',
    ],
    coverageDirectory: 'coverage',
    testResultsProcessor: 'jest-sonar-reporter',
    maxWorkers: '50%', // Limit worker processes to prevent resource exhaustion
    cacheDirectory: '<rootDir>/node_modules/.cache/jest',
};

export default config;
