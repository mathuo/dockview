import { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    preset: 'ts-jest',
    roots: ['<rootDir>/packages/dockview-modules'],
    modulePaths: ['<rootDir>/packages/dockview-modules/src'],
    displayName: { name: 'dockview-modules', color: 'blue' },
    rootDir: '../../',
    collectCoverageFrom: [
        '<rootDir>/packages/dockview-modules/src/**/*.{js,jsx,ts,tsx}',
    ],
    setupFiles: [
        // ResizeObserver / PointerEvent are not implemented in jsdom; reuse the
        // core mocks.
        '<rootDir>/packages/dockview-core/src/__tests__/__mocks__/resizeObserver.js',
        '<rootDir>/packages/dockview-core/src/__tests__/__mocks__/pointerEvent.js',
    ],
    setupFilesAfterEnv: [
        '<rootDir>/jest-setup.ts',
        '<rootDir>/packages/dockview-modules/src/__tests__/registerModules.ts',
    ],
    coveragePathIgnorePatterns: ['/node_modules/'],
    moduleNameMapper: {
        '^dockview-core$': '<rootDir>/packages/dockview-core/src/index.ts',
        '^dockview-modules$':
            '<rootDir>/packages/dockview-modules/src/index.ts',
    },
    modulePathIgnorePatterns: [
        '<rootDir>/packages/dockview-modules/src/__tests__/registerModules.ts',
    ],
    coverageDirectory: '<rootDir>/packages/dockview-modules/coverage/',
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
