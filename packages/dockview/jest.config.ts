import { JestConfigWithTsJest } from 'ts-jest';
import { join, normalize } from 'path';

const tsconfig = normalize(join(__dirname, '..', '..', 'tsconfig.test.json'));

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    roots: ['<rootDir>/packages/dockview'],
    modulePaths: ['<rootDir>/packages/dockview/src'],
    displayName: { name: 'dockview', color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [
        '<rootDir>/packages/dockview/src/__tests__/__mocks__/resizeObserver.js',
    ],
    setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    modulePathIgnorePatterns: [
        '<rootDir>/packages/dockview/src/__tests__/__mocks__',
        '<rootDir>/packages/dockview/src/__tests__/__test_utils__',
    ],
    coverageDirectory: '<rootDir>/packages/dockview/coverage/',
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
