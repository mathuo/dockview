import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    displayName: { name: 'root', color: 'blue' },
    projects: ['<rootDir>/packages/*/jest.config.ts'],
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/packages/*/src/**/*.{js,jsx,ts,tsx}'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>packages/*/src/__tests__/',
    ],
    coverageDirectory: 'coverage',
    testResultsProcessor: 'jest-sonar-reporter',
};

export default config;
