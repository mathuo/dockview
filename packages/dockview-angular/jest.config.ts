import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    roots: ['<rootDir>/packages/dockview-angular'],
    modulePaths: ['<rootDir>/packages/dockview-angular/src'],
    displayName: { name: 'dockview', color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview-angular/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [
        // '<rootDir>/packages/dockview-angular/src/__tests__/__mocks__/resizeObserver.js',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    modulePathIgnorePatterns: [
        // '<rootDir>/packages/dockview-angular/src/__tests__/__mocks__',
        // '<rootDir>/packages/dockview-angular/src/__tests__/__test_utils__',
    ],
    coverageDirectory: '<rootDir>/packages/dockview-angular/coverage/',
    testResultsProcessor: 'jest-sonar-reporter',
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.test.json',
            },
        ],
    },
};

export default config;
