import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    roots: ['<rootDir>/packages/dockview-vue'],
    modulePaths: ['<rootDir>/packages/dockview-vue/src'],
    displayName: { name: 'dockview', color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview-vue/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [
        // '<rootDir>/packages/dockview-vue/src/__tests__/__mocks__/resizeObserver.js',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    modulePathIgnorePatterns: [
        // '<rootDir>/packages/dockview-vue/src/__tests__/__mocks__',
        // '<rootDir>/packages/dockview-vue/src/__tests__/__test_utils__',
    ],
    coverageDirectory: '<rootDir>/packages/dockview-vue/coverage/',
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
