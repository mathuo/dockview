import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    roots: ['<rootDir>/packages/dockview-react'],
    modulePaths: ['<rootDir>/packages/dockview-react/src'],
    displayName: { name: 'dockview-react', color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview-react/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [
        // '<rootDir>/packages/dockview-react/src/__tests__/__mocks__/resizeObserver.js',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    modulePathIgnorePatterns: [
        // '<rootDir>/packages/dockview-react/src/__tests__/__mocks__',
        // '<rootDir>/packages/dockview-react/src/__tests__/__test_utils__',
    ],
    coverageDirectory: '<rootDir>/packages/dockview-react/coverage/',
    // testResultsProcessor inherited from root config
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
