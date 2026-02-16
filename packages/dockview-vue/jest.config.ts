import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    roots: ['<rootDir>/packages/dockview-vue'],
    modulePaths: ['<rootDir>/packages/dockview-vue/src'],
    displayName: { name: 'dockview-vue', color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview-vue/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [
        '<rootDir>/packages/dockview-vue/src/__tests__/__mocks__/resizeObserver.js',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    moduleNameMapper: {
        '^dockview-core$': '<rootDir>/packages/dockview-core/src/index.ts',
    },
    modulePathIgnorePatterns: [
        '<rootDir>/packages/dockview-vue/src/__tests__/__mocks__',
        '<rootDir>/packages/dockview-vue/src/__tests__/__test_utils__',
    ],
    coverageDirectory: '<rootDir>/packages/dockview-vue/coverage/',
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
